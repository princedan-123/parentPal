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
  }
}
export default userController;