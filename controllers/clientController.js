import sha1 from 'sha1';
import db from '../utils/db.js';
import axios from 'axios';


const ClientController = {
  async createClient(req, res) {
    const {firstName, lastName, email, password, phone, streetNumber, streetName, city, state, country} = req.body;
    if (!firstName || !lastName || !email || !password || !phone || !streetNumber || !streetName || !city || !state || !country) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
      const hashedPassword = sha1(password);
      await db.init();
      console.log('database initiated');
      // Check if client already exists
      const existingClient = await db.clientCollection.findOne({ email });
      if (existingClient) {
        return res.status(400).json({ message: 'Client already exists' });
      }
      // prepare query string for geocoding
      const query = `${streetNumber} ${streetName} ${city} ${state} ${country}`;
      const uri = encodeURI(`https://api.tomtom.com/search/2/geocode/${query}.json`);
      const response = await axios.get(uri, {params: {key: process.env.DB_tomtomApiKey}});
      const results = response.data.results;
      if (!results && results.length === 0) {
        return res.status(400).json({ message: 'Invalid address' });
      }
      results.sort((a, b) => {
        return b.matchConfidence.score - a.matchConfidence.score;
      })
      let bestMatch = results[0];
      const {lat, lon} = bestMatch.position;
      const location = {type: 'Point', coordinates: [lon, lat]};
      const address = bestMatch.address.freeformAddress;
      // Insert client data into database
      const clientData = {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        createdAt: new Date().toDateString(),
        phone,
        streetNumber,
        streetName,
        city,
        state,
        country,
        location,
        address
      };
      const newClient = await db.clientCollection.insertOne(clientData);
      return res.status(201).json({ message: 'Client created successfully', clientId: newClient.insertedId });  
    } catch (error) {
      return res.status(500).json({ message: "Error" });
    } finally {
        await db.close();
    }
  },

  async deleteClient(req, res) {
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required field' });
    }
    try {
      await db.init();
      const deletedClient = await db.clientCollection.deleteOne({ email });
      if (deletedClient.deletedCount === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }
      return res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: `Error: ${error.message}` });
    } finally {
        await db.close();
    }
  },

  async Login(req, res) {
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
      const client =  await db.clientCollection.findOne({email});
      if (client && client.password === hashedPassword) {
        const {
          firstName, lastName, userName, country, state,
          city, area, street, email
        } = client;
        const clientData = {
          firstName, lastName, userName, country, state,
          city, area, street, email
        }
        req.session.client = clientData;
          return res.status(200).json({ status: 'logged in' })
      }
      if (!client) {
        return res.status(404).json({ error: 'incorrect email'});
      }
      if(client.password !== hashedPassword) {
        return res.status(404).json({ error: 'incorrect password'});
      }
    } catch (error) {
        res.status(500).json({ error: `an error occurred during authentication: ${error}`})
    } finally{
       await db.close();
    }
  },

  async Logout(req, res) {
    if (!req.session.client) {
      return res.status(404).json({ error: 'user not logged in'});
    }
    response.clearCookie('sessionId');
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ error: 'an error occurred during logout'});
      }
      return res.status(200).json({ status: 'logged out' });
    });
  },

  async getClients(req, res) {
    try {
      await db.init();
      const projection = { firstName: 1, lastName: 1, createdAt: 1, email: 1}
      const clients = await db.clientCollection.find({}, {projection}).toArray();
      return res.status(200).json(clients);
    } catch (error) {
      console.error(`Error fetching clients: ${error.message}`); 
      return res.status(500).json({ message: `Error: ${error.message}` });
    } finally {
      await db.close()
    }
  },

  async updateClient(request, response) {
    const {email, firstName, lastName, phone, streetNumber, streetName, city, state, country } = request.body;
    if (!email) {
      return response.status(400).json("Email is required for the update");
    }
    const update = {firstName, lastName, phone, streetNumber, streetName, city, state, country};
    // retrieve the data we want to update
    const mutable = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "streetNumber",
        "streetName",
        "city",
        "state",
        "country"
      ]
    
    for (const field of Object.keys(update)) {
      if(update[field] !== undefined && !mutable.includes(field)) {
        return response.status(400).json({ error: `you cannot update this ${field}`});
      }
    }
    await db.init();
    try{
      const updateResult = await db.tutorCollection.updateOne({ email }, {$set: update });
      console.log('Update Result:', JSON.stringify(updateResult, null, 2));
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
}
export default ClientController;
