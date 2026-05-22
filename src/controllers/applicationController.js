import applicationService from '../services/applicationService.js';
import { successResponse } from '../utils/helpers.js';

export class ApplicationController {
      async applyForJob(req, res, next) {
            try {
                  const { jobId } = req.params;
                  const application = await applicationService.applyForJob(jobId, req.user.id, req.body);
                  return successResponse(res, 201, 'Application submitted successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async getApplication(req, res, next) {
            try {
                  const application = await applicationService.getApplicationById(req.params.id);
                  return successResponse(res, 200, 'Application retrieved successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async getJobApplications(req, res, next) {
            try {
                  const { page = 1, limit = 10 } = req.query;
                  const result = await applicationService.getJobApplications(
                        req.params.jobId,
                        req.user.id,
                        page,
                        limit
                  );
                  return successResponse(res, 200, 'Job applications retrieved successfully', result);
            } catch (error) {
                  next(error);
            }
      }

      async getUserApplications(req, res, next) {
            try {
                  const { page = 1, limit = 10 } = req.query;
                  const result = await applicationService.getUserApplications(req.user.id, page, limit);
                  return successResponse(res, 200, 'User applications retrieved successfully', result);
            } catch (error) {
                  next(error);
            }
      }

      async updateApplicationStatus(req, res, next) {
            try {
                  const application = await applicationService.updateApplicationStatus(
                        req.params.id,
                        req.user.id,
                        req.body
                  );
                  return successResponse(res, 200, 'Application status updated successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async shortlistApplication(req, res, next) {
            try {
                  const application = await applicationService.shortlistApplication(req.params.id, req.user.id);
                  return successResponse(res, 200, 'Application shortlisted successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async scheduleInterview(req, res, next) {
            try {
                  const application = await applicationService.scheduleInterview(req.params.id, req.user.id);
                  return successResponse(res, 200, 'Interview scheduled successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async makeOffer(req, res, next) {
            try {
                  const application = await applicationService.makeOffer(req.params.id, req.user.id);
                  return successResponse(res, 200, 'Offer made successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async rejectApplication(req, res, next) {
            try {
                  const application = await applicationService.rejectApplication(req.params.id, req.user.id);
                  return successResponse(res, 200, 'Application rejected successfully', application);
            } catch (error) {
                  next(error);
            }
      }

      async withdrawApplication(req, res, next) {
            try {
                  const result = await applicationService.withdrawApplication(req.params.id, req.user.id);
                  return successResponse(res, 200, result.message);
            } catch (error) {
                  next(error);
            }
      }
}

export default new ApplicationController();