import express from 'express';
import ClientController from '../controllers/clientController.js';

const router = express.Router();
router.post('/createClient', ClientController.createClient);
router.delete('/deleteClient', ClientController.deleteClient);

export default router;

