import express from 'express';
import dotenv from 'dotenv';

dotenv.config();
const { SERVER_PORT } = process.env;
const app = express();
app.all('/', (req, res) => {
  res.send('welcome to parentPal\n');
})
app.listen(SERVER_PORT, () => {
  console.log('server is running');
})
