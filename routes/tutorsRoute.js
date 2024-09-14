import express from 'express';
import userController from '../controllers/userController.js'
import appController from '../controllers/appController.js';

const router = express.Router();
router.post('/createTutor', userController.createTutor);
router.post('/login', appController.login);
router.get('/viewTutorProfile', userController.profile);
router.delete('/logout_tutor', userController.logout);
router.delete('/removeTutor', userController.removeTutor);
router.patch('/updateTutorProfile', userController.updateProfile);
export default router;