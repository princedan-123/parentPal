import sha1 from 'sha1';
import db from '../utils/db.js';
import axios from 'axios';


const ClientController = {
  async createClient(req, res) {
    console.log('createClient');
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
      const response = await axios.get(uri, {params: {key: process.env.tomApi_key}});
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
      const userName = `${newClient.firstName}-${newClient.lastName}`;
      return res.status(201).json({ message: 'Client created successfully'});  
    } catch (error) {
      return res.status(500).json({ message: `Error: ${error}` });
    } finally {
        await db.close();
    }
  },

  async deleteClient(req, res) {
    if (!req.session.client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    const {email, password} = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing required field' });
    }
    await db.init();
    try {
      const hashedPassword = sha1(password);
      const user = await db.clientCollection.findOne({email});
      if(!user) {
        return response.status(404).json({ error: 'user not found' });
      }
      const { userName } = user;
      if(hashedPassword !== user.password) {
        return response.status(400).json({ unauthorized: 'incorrect password' });
      }
      const deletedClient = await db.clientCollection.deleteOne({ email });
      if (deletedClient.deletedCount === 0) {
        return res.status(404).json({ message: 'Client not found' });
      }
      return res.status(200).json({ message: 'account has been successfully removed' });
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
        clientData.userName = `${firstName}-${lastName}`;
        req.session.client = clientData;
        if (req.session.client) {
          return res.status(200).json({ status: `logged in, welcome ${clientData.userName}` })
        }
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
    if(!req.session.client) {
      return response.status(404).json({ error: 'user not logged in'});
    }
    const {userName} = req.session.client;
    req.session.destroy();
    res.clearCookie('sessionId');
    if(!req.session) {
      return res.status(200).json({ message: `${userName} succesfully logged out` });
    }
    return res.status(500).json({ error: `${userName} is still active` })
  },

  async getClients(req, res) {
    // Check if the client exists in the session
    if (!req.session.client) {
      return res.status(404).json({ error: "client not found" });
    }
  
    // Destructure necessary fields from session client
    const {
      firstName, lastName, userName, country, state,
      city, area, street, email
    } = req.session.client;
  
    await db.init();
  
    try {
      // Find client by email in the database
      const client = await db.clientCollection.findOne({ email });
      
      // Check if the client exists in the database
      if (!client) {
        return res.status(404).json({ error: 'client not found' });
      }
  
      // Destructure necessary fields from the database client
      const {
        firstName: dbFirstName, lastName: dbLastName, userName: dbUserName,
        country: dbCountry, state: dbState, city: dbCity,
        area: dbArea, street: dbStreet, email: dbEmail
      } = client;
  
      // Prepare client data to send in the response
      const clientData = {
        firstName: dbFirstName || firstName,
        lastName: dbLastName || lastName,
        userName: dbUserName || userName,
        country: dbCountry || country,
        state: dbState || state,
        city: dbCity || city,
        area: dbArea || area,
        street: dbStreet || street,
        email: dbEmail || email
      };
  
      // Return the client data as a JSON response
      return res.status(200).json(clientData);
  
    } catch (error) {
      // Return an error response if something goes wrong
      return res.status(500).json({ error: `${error.message}` });
    } finally {
      // Close the database connection
      await db.close();
    }
  },
  

  async updateClient(request, response) {
    if (!request.session.client) {
      return response.status(404).json({ error : "client not found"});
    }
    const { email } = request.session.client;
    if (!email) {
      return response.status(400).json("Email is required for the update");
    }
    const update = request.body;
    if (!update) {
      return response.status(400).json({ error: 'missing fields to update'});
    }
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
    // retrieve the data we want to update
    
    
    for (const field of Object.keys(update)) {
      if(update[field] !== undefined && !mutable.includes(field)) {
        return response.status(400).json({ error: `you cannot update this ${field}`});
      }
    }
    await db.init();
    try{
      const updateResult = await db.clientCollection.updateOne({ email }, {$set: update });
      console.log('Update Result:', JSON.stringify(updateResult, null, 2));
      if(updateResult.modifiedCount === 1) {
        return response.status(200).json({ message: `successfully updated fields for ${Object.keys(update)}`});
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