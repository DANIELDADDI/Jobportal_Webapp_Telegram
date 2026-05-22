import express from 'express';
import applicationController from '../controllers/applicationController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validation.js';

const router = express.Router();


// Apply for a job (jobseekers)
router.post('/job/:jobId', authMiddleware, requireRole('jobseeker'), validate(schemas.createApplicationSchema), applicationController.applyForJob);


// Get user's applications
router.get('/my-applications', authMiddleware, requireRole('jobseeker'), applicationController.getUserApplications);


// Withdraw application (jobseekers)
router.delete('/:id/withdraw', authMiddleware, requireRole('jobseeker'), applicationController.withdrawApplication);


// Get specific application
router.get('/:id', authMiddleware, applicationController.getApplication);


// Get job applications (employers only)
router.get('/job/:jobId/applications', authMiddleware, requireRole('employer'), applicationController.getJobApplications);


// Update application status (employers)
router.put('/:id/status', authMiddleware, requireRole('employer'), validate(schemas.updateApplicationSchema), applicationController.updateApplicationStatus);


// Shortlist application (employers)
router.patch('/:id/shortlist', authMiddleware, requireRole('employer'), applicationController.shortlistApplication);


// Schedule interview (employers)
router.patch('/:id/interview', authMiddleware, requireRole('employer'), applicationController.scheduleInterview);


// Make offer (employers)
router.patch('/:id/offer', authMiddleware, requireRole('employer'), applicationController.makeOffer);


// Reject application (employers)
router.patch('/:id/reject', authMiddleware, requireRole('employer'), applicationController.rejectApplication);

export default router;