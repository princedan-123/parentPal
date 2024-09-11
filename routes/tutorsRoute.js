import express from 'express';
import userController from '../controllers/userController.js'

const router = express.Router();
router.post('/createTutor', userController.createTutor);
export default router;