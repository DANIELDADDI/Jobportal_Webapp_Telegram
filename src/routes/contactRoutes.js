import express from 'express';
import contactController from '../controllers/contactController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();



// Public route - submit contact message
router.post('/', validate(schemas.createContactSchema), contactController.createContactMessage);




// Admin/Protected routes
router.get('/', authMiddleware, requireRole('admin'), contactController.getAllContactMessages);
router.get('/:id', authMiddleware, requireRole('admin'), contactController.getContactMessage);
router.patch('/:id/read', authMiddleware, requireRole('admin'), contactController.markAsRead);
router.delete('/:id', authMiddleware, requireRole('admin'), contactController.deleteContactMessage);

export default router;