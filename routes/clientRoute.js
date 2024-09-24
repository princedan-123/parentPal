import express from 'express';
import appController from '../controllers/appController.js';
import ClientController from '../controllers/clientController.js';

const clientRouter = express.Router();
clientRouter.get('/searchClient', appController.searchTutor)
clientRouter.post('/createClient', ClientController.createClient); //done
clientRouter.delete('/deleteClient', ClientController.deleteClient); //done
clientRouter.post('/Login', ClientController.Login); //done
clientRouter.delete('/Logout', ClientController.Logout); //done
clientRouter.get('/getProfile', ClientController.getClients); //done
clientRouter.patch('/updateProfile', ClientController.updateClient); //done

export default clientRouter;