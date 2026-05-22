// src/routes/jobRoutes.js
import { Router } from 'express';
import jobController from '../controllers/jobController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';


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
router.post('/', authMiddleware, validate, jobController.createJob);
router.put('/:jobId', authMiddleware, validate, jobController.updateJob);
router.delete('/:jobId', authMiddleware, jobController.deleteJob);





// Job status operations
router.patch('/:jobId/publish', authMiddleware, jobController.publishJob);
router.patch('/:jobId/close', authMiddleware, jobController.closeJob);
router.patch('/:jobId/feature', authMiddleware, jobController.featureJob);




// Employer operations
router.get('/employer/my-jobs', authMiddleware, jobController.getEmployerJobs);

export default router;