import express from 'express';
import ClientController from '../controllers/clientController.js';

const router = express.Router();
router.post('/createClient', ClientController.createClient); //done
router.delete('/deleteClient', ClientController.deleteClient); //done
router.post('/clientLogin', ClientController.Login); //done
router.delete('/clientLogout', ClientController.Logout); //done
router.get('/getClient', ClientController.getClients); //done
router.patch('/updateClient', ClientController.updateClient); //done

export default router;

