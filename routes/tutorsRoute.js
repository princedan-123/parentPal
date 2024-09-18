import express from 'express';
import userController from '../controllers/userController.js'
import appController from '../controllers/appController.js';

const router = express.Router();
router.post('/createTutor', userController.createTutor);
router.post('/login', appController.login);
router.get('/viewProfile', userController.profile);
router.delete('/logout', userController.logout);
router.delete('/remove', userController.removeTutor);
router.patch('/updateProfile', userController.updateProfile);
export default router;