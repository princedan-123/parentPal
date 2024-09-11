import express from 'express';
import dotenv from 'dotenv';
import router from './routes/tutorsRoute.js';

dotenv.config();
const { SERVER_PORT } = process.env;
const app = express();
app.use(express.json());
app.use(router);
app.get('/', (req, res) => {
  res.send('welcome to parentPal\n');
})
app.listen(SERVER_PORT, () => {
  console.log('server is runing');
})