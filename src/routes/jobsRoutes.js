// src/routes/jobRoutes.js
import { Router } from 'express';
import jobController from '../controllers/jobController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateJobInput } from '../middleware/validation.js';

const router = Router();




// Public routes
router.get('/', jobController.getAllJobs);
router.get('/search', jobController.searchJobs);
router.get('/featured', jobController.getFeaturedJobs);
router.get('/featured/top', jobController.getTopFeaturedJobs);
router.get('/featured/category/:categoryId', jobController.getFeaturedJobsByCategory);
router.get('/featured/location/:location', jobController.getFeaturedJobsByLocation);
router.get('/featured/search', jobController.searchFeaturedJobs);
router.get('/:jobId', jobController.getJobById);



// Protected routes (require authentication)
router.post('/', authenticateToken, validateJobInput, jobController.createJob);
router.put('/:jobId', authenticateToken, validateJobInput, jobController.updateJob);
router.delete('/:jobId', authenticateToken, jobController.deleteJob);





// Job status operations
router.patch('/:jobId/publish', authenticateToken, jobController.publishJob);
router.patch('/:jobId/close', authenticateToken, jobController.closeJob);
router.patch('/:jobId/feature', authenticateToken, jobController.featureJob);




// Employer operations
router.get('/employer/my-jobs', authenticateToken, jobController.getEmployerJobs);

export default router;