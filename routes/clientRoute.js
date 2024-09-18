import express from 'express';
import appController from '../controllers/appController.js';

const clientRouter = express.Router();
clientRouter.get('/searchClient', appController.searchTutor);
export default clientRouter;