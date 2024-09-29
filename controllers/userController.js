import sha1 from 'sha1';
import axios from 'axios';
import db from '../utils/db.js';
import { validateNewUSer } from '../utils/userValidation.js';

const userController = {
  async createTutor(request, response) {
    const userData = request.body;
    // validate  the user structure
    const validity = validateNewUSer(userData);
    if (!validity.valid) {
      return response.status(400).json({validity});
    }
    if (validity.valid) {
      // email validation
      const { email, password, country, state, area, street, majorRoad, city } = userData;
      if (!email) {
        return response.status(400).json({error: 'missing email'});
      }
      // password validation
      if (!password) {
        return response.status(400).json({error: 'missing password'});
      }
      const hashedPassword =  sha1(password);
      try {
        await db.init();
        // check if user already exists
        const query = await db.tutorCollection.find({email}).toArray();
        if (query.length > 0) {
          return response.status(403).json({error: 'user already exist'});
        }
        const searchText = `${country} ${state} ${city} ${area} ${street} ${majorRoad}`
        let encodedUri = encodeURI(`https://api.tomtom.com/search/2/geocode/${searchText}.json`)
        let res = await axios.get(encodedUri, { params: { key: process.env.tomApi_key } });
        let results = res.data.results;
        if(results.length !== 0) {
          results.sort((a, b) => {
            return b.matchConfidence.score - a.matchConfidence.score;
          })
          const closestMatch = results[0];
          userData.position = {
            latitude: closestMatch.position.lat,
            longitude: closestMatch.position.lon
          }
          userData.password = hashedPassword;
          userData.createdOn = new Date().toDateString();
          const insertResult = await db.tutorCollection.insertOne(userData);
          if(insertResult){
            return response.status(201).json({ message: `Tutor ${userData.lastName} has been created successfully` });
          }
        }
        // // fallback geocoding with openroute API
        // encodedUri = encodeURI('https://api.openrouteservice.org/geocode/search');
        // const httpResponse = await axios.get(encodedUri, { params: {
        //   "api_key": process.env.openRoute_key,
        //   "text": searchText
        // }})
        // results = httpResponse.data.features;
        // if(results.length !== 0) {
        //   // find the location with the highest confidence score
        //   results.sort((a, b) => {
        //     return b.properties.confidence - a.properties.confidence;
        //   });
        //   const closestMatch = results[0];
        //   console.log('!!!closest match:', closestMatch)
        //   userData.position = {
        //     latitude: closestMatch.geometry.coordinates[1],
        //     longitude: closestMatch.geometry.coordinates[0]
        //   }
        //   userData.password = hashedPassword;
        //   userData.createdOn = new Date().toDateString();
        //   userData.geocoding = 'fallback';
        //   const insertResult = await db.tutorCollection.insertOne(userData);
        //   if(insertResult){
        //     return response.status(201).json({ message: `Tutor ${userData.lastName} has been created successfully` });
        //   }
        // }
        else {
          return response.status(404).json({ 
            error: "unable to geocode address, please provide more data"
          })
        }
      } catch(error) {
          return response.status(500).json({error: `${error.message}`})
      } finally {
        await db.close();
      }
    }
  },
  async profile(request, response) {
    if (!request.session.user) {
      return response.status(404).json({ error : "user not found"});
    }
    if(request.session.user) {
      const {
        firstName, lastName, userName, qualifications,
        country, state, city, area,
        street, subject, available
      } = request.session.user
      const profile = {
        firstName,
        lastName,
        userName,
        qualifications,
        teaches: subject,
        available,
        country,
        state,
        city,
        area,
        street
      }
      return response.status(200).json(profile);
    }
  },
  async logout(request, response) {
    if(!request.session.user) {
      return response.status(404).json({ error: 'user not logged in'});
    }
    const {userName} = request.session.user;
    request.session.destroy();
    response.clearCookie('sessionId');
    if(!request.session) {
      return response.status(200).json({ message: `succesfully logged out ${userName}` });
    }
    return response.status(500).json({ error: `${userName} is still active` })
  },
  async removeTutor(request, response) {
    if(!request.session.user) {
      return response.status(404).json({ unauthorized: 'user not logged in' });
    }
    const { email, password } = request.body;
    if(!email) {
      return response.status(400).json({ unauthorized: 'email field is required'});
    }
    if(!password) {
      return response.status(400).json({ unauthorized: 'password field is required'});
    }
    await db.init();
    try{
      const hashedPassword = sha1(password);
      const user = await db.tutorCollection.findOne({email});
      if(!user) {
        return response.status(404).json({ error: 'user not found' });
      }
      const { userName } = user;
      if(hashedPassword !== user.password) {
        return response.status(400).json({ unauthorized: 'incorrect password' });
      }
      const deleteResult = await db.tutorCollection.deleteOne({email});
      if(deleteResult.deletedCount === 1) {
        return response.status(200).json({ message: `${userName}'s account has been successfully removed` })
      }
    } catch(error) {
      return response.status(500).json({ error: `${error.message}` });
    } finally{
      await db.close();
    }
  },
  async updateProfile(request, response) {
    // check if user is logged in 
    if(!request.session.user) {
      return response.status(404).json({ error: 'user not found' });
    }
    const { email } = request.session.user;
    // retrieve the data we want to update
    const update = request.body;
    if(update) {
      // a list of fields that can be updated
      const mutable = ['subjects', 'available', 'qualifications',
        'phoneNumber', 'socialMediaHandles', 'country',
        'state', 'city', 'area',
        'street' 
      ]
      // a list of field that must be an array
      const arrayFields = ['subjects', 'qualifications', 'socialMediaHandles']
      for(const field of Object.keys(update)) {
        if(!mutable.includes(field)) {
          return response.status(400).json({ error: `you cannot update this ${field}`});
        }
        if(arrayFields.includes(field)){
          if(!Array.isArray(update[field])) {
            return response.status(400).json({ error: `${field} is an array`});
          }
        }
        if(!arrayFields.includes(field)) {
          update[field] = update[field].toString();
        }
      }
      await db.init();
      try{
        const updateResult = await db.tutorCollection.updateOne({ email }, {$set: update });
        if(updateResult.modifiedCount === 1) {
          // updating stale session cache
          for(const updateField of Object.keys(update)) {
            if(request.session.user[updateField]) {
              request.session.user[updateField] = update[updateField];
            }
          request.session.save();
        }
          return response.status(200).json({ message: `successfully updated ${Object.keys(update)} field`});
        }
        if(updateResult.modifiedCount === 0) {
          return response.status(400).json({ message: 'no changes were made to profile '});
        }
      } catch(error) {
        return response.status(500).json({ error: `${error.message}`});
      } finally{
        await db.close();
      }
    }
    return response.status(400).json({ error: 'no data to update' });
  }
}
export default userController;