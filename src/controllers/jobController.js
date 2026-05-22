// src/controllers/jobController.js
import jobService from '../services/jobService.js';

export default {
      /**
       * Get all jobs
       */
      getAllJobs: async (req, res) => {
            try {
                  const { category_id, location, job_type, remote, page = 1, limit = 10 } = req.query;

                  const filters = {};
                  if (category_id) filters.category_id = category_id;
                  if (location) filters.location = location;
                  if (job_type) filters.job_type = job_type;
                  if (remote) filters.remote = remote;

                  const result = await jobService.getAllJobs(filters, parseInt(page), parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Jobs fetched successfully',
                        ...result
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch jobs'
                  });
            }
      },

      /**
       * Search jobs
       */
      searchJobs: async (req, res) => {
            try {
                  const { keyword, page = 1, limit = 10 } = req.query;

                  if (!keyword) {
                        return res.status(400).json({
                              success: false,
                              message: 'Search keyword is required'
                        });
                  }

                  const result = await jobService.searchJobs(keyword, parseInt(page), parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Search completed',
                        ...result
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Search failed'
                  });
            }
      },

      /**
       * Get job by ID
       */
      getJobById: async (req, res) => {
            try {
                  const { jobId } = req.params;

                  const job = await jobService.getJobById(jobId);

                  res.json({
                        success: true,
                        message: 'Job fetched successfully',
                        data: job
                  });
            } catch (error) {
                  res.status(404).json({
                        success: false,
                        message: error.message || 'Job not found'
                  });
            }
      },

      /**
       * Create a new job
       */
      createJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const jobData = req.body;

                  // Validate required fields
                  if (!jobData.title || !jobData.description || !jobData.category_id || !jobData.location) {
                        return res.status(400).json({
                              success: false,
                              message: 'Missing required fields: title, description, category_id, location'
                        });
                  }

                  const result = await jobService.createJob(userId, jobData);

                  res.status(201).json(result);
            } catch (error) {
                  const statusCode = error.message.includes('limit') ? 402 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to create job'
                  });
            }
      },

      /**
       * Update a job
       */
      updateJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { jobId } = req.params;
                  const jobData = req.body;

                  const result = await jobService.updateJob(jobId, userId, jobData);

                  res.json(result);
            } catch (error) {
                  const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to update job'
                  });
            }
      },

      /**
       * Delete a job
       */
      deleteJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { jobId } = req.params;

                  const result = await jobService.deleteJob(jobId, userId);

                  res.json(result);
            } catch (error) {
                  const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to delete job'
                  });
            }
      },

      /**
       * Publish a job
       */
      publishJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { jobId } = req.params;

                  const result = await jobService.publishJob(jobId, userId);

                  res.json(result);
            } catch (error) {
                  const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to publish job'
                  });
            }
      },

      /**
       * Close a job
       */
      closeJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { jobId } = req.params;

                  const result = await jobService.closeJob(jobId, userId);

                  res.json(result);
            } catch (error) {
                  const statusCode = error.message.includes('Unauthorized') ? 403 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to close job'
                  });
            }
      },

      /**
       * Feature a job
       */
      featureJob: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { jobId } = req.params;

                  const result = await jobService.featureJob(jobId, userId);

                  res.json(result);
            } catch (error) {
                  const statusCode = error.message.includes('limit') || error.message.includes('plan') ? 402 : 500;
                  res.status(statusCode).json({
                        success: false,
                        message: error.message || 'Failed to feature job'
                  });
            }
      },

      /**
       * Get employer's jobs
       */
      getEmployerJobs: async (req, res) => {
            try {
                  const userId = req.user.id;
                  const { page = 1, limit = 10 } = req.query;

                  const result = await jobService.getEmployerJobs(userId, parseInt(page), parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Employer jobs fetched successfully',
                        ...result
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch jobs'
                  });
            }
      },

      /**
       * Get featured jobs
       */
      getFeaturedJobs: async (req, res) => {
            try {
                  const { limit = 10 } = req.query;

                  const result = await jobService.getFeaturedJobs(parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Featured jobs fetched successfully',
                        data: result.data
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch featured jobs'
                  });
            }
      },

      /**
       * Get top featured jobs
       */
      getTopFeaturedJobs: async (req, res) => {
            try {
                  const { limit = 5 } = req.query;

                  const result = await jobService.getTopFeaturedJobs(parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Top featured jobs fetched successfully',
                        data: result.data
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch top featured jobs'
                  });
            }
      },

      /**
       * Get featured jobs by category
       */
      getFeaturedJobsByCategory: async (req, res) => {
            try {
                  const { categoryId } = req.params;
                  const { limit = 10 } = req.query;

                  const result = await jobService.getFeaturedJobsByCategory(categoryId, parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Featured jobs by category fetched successfully',
                        data: result.data
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch jobs'
                  });
            }
      },

      /**
       * Get featured jobs by location
       */
      getFeaturedJobsByLocation: async (req, res) => {
            try {
                  const { location } = req.params;
                  const { limit = 10 } = req.query;

                  const result = await jobService.getFeaturedJobsByLocation(location, parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Featured jobs by location fetched successfully',
                        data: result.data
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Failed to fetch jobs'
                  });
            }
      },

      /**
       * Search featured jobs
       */
      searchFeaturedJobs: async (req, res) => {
            try {
                  const { keyword } = req.query;
                  const { limit = 10 } = req.query;

                  if (!keyword) {
                        return res.status(400).json({
                              success: false,
                              message: 'Search keyword is required'
                        });
                  }

                  const result = await jobService.searchFeaturedJobs(keyword, parseInt(limit));

                  res.json({
                        success: true,
                        message: 'Search completed',
                        data: result.data
                  });
            } catch (error) {
                  res.status(500).json({
                        success: false,
                        message: error.message || 'Search failed'
                  });
            }
      }
};