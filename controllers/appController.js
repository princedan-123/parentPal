import axios from 'axios';
import db from '../utils/db.js';
import sha1 from 'sha1';

const appController = {
  async login(req, res) {
    const {email, password} = req.body;
    if (!email) {
      return res.status(404).json({ error: 'missing email'});
    }
    if (!password) {
      return res.status(404).json({ error: 'missing password'});
    }
    await db.init();
    try {
      const hashedPassword = sha1(password);
      const user =  await db.tutorCollection.findOne({email});
      if (user && user.password === hashedPassword) {
        const {
          firstName, lastName, userName, qualifications, country, state,
          city, area, street, subject, available, email
        } = user;
        const userData = {
          firstName, lastName, userName, qualifications, country, state,
          city, area, street, subject, available, email
        }
        req.session.user = userData;
        return res.status(200).json({ status: 'logged in' })
      }
      if (!user)
      {
        return res.status(404).json({ error: 'incorrect login credentials'});
      }
      if(user.password !== hashedPassword) {
        return res.status(404).json({ error: 'incorrect login credentials'});
      }
      } catch (error) {
      res.status(500).json({ error: `an error occurred during authentication: ${error}`})
    } finally{
      await db.close();
    }
  },
  async searchTutor(req, res) {
    /* this method fetches the client point location
       and utilizes it to fetch the nearest tutor
    */
   let address = req.body;
   const requiredFields = [
    "locality", "major_road", "state_region",
    "street", "country", "subjects"
  ]
  //validate required fields
  for(const field of Object.keys(address)) {
    if(!requiredFields.includes(field)) {
      if(field !== 'subjects' && typeof address[field] !== 'string') {
        return res.status(400).json(
          { error: "missing field or inappropriate value type" }
        );
      }
      if(field === 'subjects' && !Array.isArray(address[field])) {
        return res.status(400).json({ error: 'subject field must be an array '})
      }
    }
  }
  let { street, major_road, locality, state_region, country, subjects } = address;
  address = `${street} ${major_road} ${locality} ${state_region} ${country}`
  let encodedUri = encodeURI(`https://api.tomtom.com/search/2/geocode/${address}.json`);
  try{
    let origin;
    let result = await axios.get(encodedUri, {params: {key: process.env.tomApi_key}});
    result = result.data.results;
    if(result.length !== 0) {
      result.sort((a, b) => {
        return b.matchConfidence.score - a.matchConfidence.score;
      })
      let closestMatch = result[0];
      origin = [
        {
          "point": {
            "latitude": closestMatch.position.lat,
            "longitude": closestMatch.position.lon
          }
        }
      ]
    }
    if(result.length === 0) {
      return res.status(404).json({
        error:'could not encode clients address provide more data for better accuracy'
      })
    }
    const destination = [];
    // search for users with specific subject values in a paginated manner
    await db.init();
    const page = req.query.page || 1;
    const pageSize = 10;
    let pageCount;
    street = new RegExp(street, 'i');
    locality = new RegExp(locality, 'i');
    state_region = new RegExp(state_region, 'i');
    country = new RegExp(country, 'i');
    const searchPattern = subjects.map(element => new RegExp(element, 'i'))
    const count = await db.tutorCollection.countDocuments(
      {
        $or: searchPattern.map(pattern => ({subject:{$elemMatch:{$regex: pattern}}}))
      },
      {projection: { 
        position: 1, firstName: 1, lastName: 1, userName: 1, subject: 1,
        available: 1, socialMediaHandles: 1, country: 1, state: 1,
        area: 1, _id: 0
      }
    });
    pageCount = Math.ceil(count / pageSize);
    const skipPages = (page - 1) * pageSize;
    let tutors = await db.tutorCollection.find(
      {
      $or: searchPattern.map(pattern => ({subject:{$elemMatch:{$regex: pattern}}}))
    },
    {projection: { 
      position: 1, firstName: 1, lastName: 1, userName: 1, subject: 1,
      available: 1, socialMediaHandles: 1, country: 1, state: 1,
      area: 1, _id: 0
    }
  }).skip(skipPages).limit(pageSize).toArray(); 
  // fall back search for tutors if first search was empty
  let fallback_tutor_search = false;
  if(tutors.length === 0) {
    fallback_tutor_search = true;
    tutors = await db.tutorCollection.find({
      $or:[
        {"country": country}, {"state": state_region}, {"area": locality},
        {"street": street}, {$or: searchPattern.map(pattern => ({subject:{$elemMatch:{$regex: pattern}}}))}
      ]
    },
    {projection: {
      position: 1, firstName: 1, lastName: 1, userName: 1, subject: 1,
      available: 1, socialMediaHandles: 1, country: 1, state: 1, area: 1,
      _id: 0
    }}).skip(skipPages).limit(pageSize).toArray();
  }
  for(const tutor of tutors) {
    destination.push({
      "point": {"latitude": tutor.position.latitude, "longitude": tutor.position.longitude}
    })
  }
  // make matrix request to tomtom api
  encodedUri = encodeURI(`https://api.tomtom.com/routing/matrix/2`);
  const jsonData = {
    "origins": origin,
    "destinations": destination,
    "options": {
      "departAt": "any",
      "traffic": "historical",
      "routeType": "fastest",
      "travelMode": "car"
    }
  }  
  const matrix = await axios.post(
    encodedUri, jsonData, {params: {key: process.env.tomApi_key}}
  );
  // sorting result of matrix in ascending order
  if(matrix.data.statistics.successes === 0) {
    return res.status(404).json({
      message: "location search was not possible due to internal error",
      fallback: tutors
    })
  }
  matrix.data.data.sort((a, b) => a.routeSummary.lengthInMeters - b.routeSummary.lengthInMeters);
  const nearestTutors = [];
  for(const distanceMatrix of matrix.data.data) {
    let index = distanceMatrix.destinationIndex;
    let distanceKilometers = Math.round(distanceMatrix.routeSummary.lengthInMeters / 1000); 
    let tutor = tutors[index];
    tutor.lengthInKilometers = distanceKilometers
    nearestTutors.push(tutor);
  }
  return res.status(200).json({
    "fallback_tutor_search": fallback_tutor_search,
     "pageCount": pageCount,
     "tutors": nearestTutors 
    });
} catch(error) {
  return res.status(500).json({ error: `${error.message}`});
} finally{
  await db.close();
}
}
}
export default appController;
