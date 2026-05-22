import express from 'express';
import authController from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';


const router = express.Router();




// Public routes
router.post('/register', validate(schemas.registerSchema), authController.register);
router.post('/login', validate(schemas.loginSchema), authController.login);




// Protected routes
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, validate(schemas.updateProfileSchema), authController.updateProfile);
router.put('/change-password', authMiddleware, authController.changePassword);



export default router;