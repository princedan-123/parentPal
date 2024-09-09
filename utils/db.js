/* creating an instance for database */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
class DbClient {
	constructor() {
		this.DB_HOST = process.env.DB_HOST || 'localhost';
		this.DB_PORT = process.env.DB_PORT || '27017';
		this.DB_NAME = process.env.DB_NAME || 'parentPal';
		this.url = `mongodb://${this.DB_HOST}:${this.DB_PORT}`;
		this.client = new MongoClient(this.url);
	}
	async init() {
		try {
			await this.client.connect();
			this.db = this.client.db(this.DB_NAME);
			this.tutorCollection = this.db.collection('tutor');
			this.clientCollection = this.db.collection('client');
		} catch(error) {
			console.log(`unable to connect to db ${error}`);
		}
	}

	async close() {
		await this.client.close();
	}
}
const db = new DbClient();
export default db;
