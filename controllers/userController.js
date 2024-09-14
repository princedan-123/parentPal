import sha1 from 'sha1';
import axios from 'axios';
import db from '../utils/db.js';
import { validateNewUSer } from '../utils/userValidation.js';
import { json } from 'express';

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
      const { email, password, userName, country, state, area, street } = userData;
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
        const query = await db.tutorCollection.find({email, userName}).toArray();
        if (query.length > 0) {
          return response.status(403).json({error: 'user already exist'});
        }
        const searchText = `${street} ${area} ${state} ${country}`
        const encodedUri = encodeURI(`https://api.tomtom.com/search/2/geocode/${searchText}.json`)
        const res = await axios.get(encodedUri, {params: {key: process.env.tomApi_key}});
        const results = res.data.results;
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
        return response.status(201).json({userId: insertResult.insertedId})
      } catch(error) {
        return response.status(500).json({error: `${error}`})
      } finally {
        await db.close();
      }
    }
  },
  async profile(request, response) {
    if (!request.session.user) {
      return response.status(401).json({ error : "unauthenticated user"});
    }
    if(request.session.user) {
      const {
        firstName, lastName, userName, qualifications,
        country, state, city, area,
        street, subjects, available
      } = request.session.user
      const profile = {
        firstName,
        lastName,
        userName,
        qualifications,
        teaches: subjects,
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
      return response.status(401).json({ error: 'user not logged in'});
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
      return response.status(401).json({ unauthorized: 'user not logged in' });
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
    console.log(email)
    // retrieve the data we want to update
    const update = request.body;
    if(update) {
      // a list of fields that can be updated
      const mutable = ['subjects', 'available', 'qualifications',
        'phoneNumber', 'socialMediaHandles', 'country',
        'state', 'city', 'area',
        'street' 
      ]
      for(const field of Object.keys(update)) {
        if(!mutable.includes(field)) {
          return response.status(400).json({ error: `you cannot update this ${field}`});
        }
      }
      await db.init();
      try{
        const updateResult = await db.tutorCollection.updateOne({ email }, {$set: update });
        if(updateResult.modifiedCount === 1) {
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