import express from 'express';
import appController from '../controllers/appController.js';
import ClientController from '../controllers/clientController.js';

const clientRouter = express.Router();
clientRouter.get('/searchClient', appController.searchTutor);
clientRouter.post('/createClient', ClientController.createClient); //done
clientRouter.delete('/deleteClient', ClientController.deleteClient); //done
clientRouter.post('/clientLogin', ClientController.Login); //done
clientRouter.delete('/clientLogout', ClientController.Logout); //done
clientRouter.get('/getClient', ClientController.getClients); //done
clientRouter.patch('/updateClient', ClientController.updateClient); //done

export default clientRouter;
