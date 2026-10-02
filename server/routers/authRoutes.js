import express from 'express';
import { register, login, protect, getCurrentUser } from '../controllers/authController.js';
import { getUsers } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/me', protect, getCurrentUser);
authRouter.get('/users', protect, getUsers)
export default authRouter;
