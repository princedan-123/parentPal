import sha1 from 'sha1';
import mongodb from 'mongodb';
const { ObjectID } = mongodb;
import db from '../utils/db.js';
import axios from 'axios';


const ClientController = {
    async createClient(req, res) {
        const {name, email, password, phone, streetNumber, streetName, city, state, country} = req.body;
        if (!name || !email || !password || !phone || !streetNumber || !streetName || !city || !state || !country) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        try {
            const hashedPassword = sha1(password);
            const client = await db.init();
            console.log('database initiated');
            // Check if client already exists
            const existingClient = await db.clientCollection.findOne({ email });
            if (existingClient) {
                return res.status(400).json({ message: 'Client already exists' });
            }
            // prepare query string for geocoding
            const query = `${streetNumber} ${streetName} ${city} ${state} ${country}`;
            const uri = encodeURI(`https://api.tomtom.com/search/2/geocode/${query}.json`);
            console.log('uri:', uri);
            const response = await axios.get(uri, {params: {key: process.env.DB_tomtomApiKey}});
            console.log('response.data:', response.data);
            const results = response.data.results;
            if (!results && results.length === 0) {
                return res.status(400).json({ message: 'Invalid address' });
            }
            let bestMatch = results[0];
            console.log('bestMatch:', bestMatch);
            //results.forEach(result => {
                //if (result.matchConfidence.score && result.matchConfidence.score > bestMatch.matchConfidence.score) {
                    //bestMatch = result;
                //}
            //});
            const {lat, lon} = bestMatch.position;
            console.log('lat:', lat);
            const location = {type: 'Point', coordinates: [lon, lat]};
            const address = bestMatch.address.freeformAddress;
            // Insert client data into database
            const clientData = {
                name,
                email,
                password: hashedPassword,
                createdAt: new Date().toDateString(),
                phone,
                location,
                address};
            const newClient = await db.clientCollection.insertOne(clientData);
            console.log('newClient:', newClient);
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
            const client = await db.init();
            //const objectId = new ObjectID(clientId);
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
    }
}
export default ClientController;
