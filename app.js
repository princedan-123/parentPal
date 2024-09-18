import express from 'express';
import dotenv from 'dotenv';
import session from 'express-session';
import RedisStore from 'connect-redis';
import router from './routes/tutorsRoute.js';
import clientRouter from './routes/clientRoute.js';
import redisClient from './utils/redis.js';

dotenv.config();
const { SERVER_PORT } = process.env;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use(session({
  store: new RedisStore({client: redisClient}),
  secret: process.env.session,
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {
    maxAge: 1000 * 60 * 60,
    httpOnly: true,
    secure: false
  }

}));
app.use(clientRouter);
app.use('/tutor', router);
app.get('/', (req, res) => {
  res.send('welcome to parentPal\n');
})
app.listen(SERVER_PORT, () => {
  console.log('server is runing');
})