// src/services/jobService.js
import pool from '../config/database.js';

export default {
      /**
       * Get all jobs with filters
       */
      async getAllJobs(filters = {}, page = 1, limit = 10) {
            try {
                  const offset = (page - 1) * limit;
                  let query = 'SELECT * FROM jobs WHERE is_deleted = false';
                  const params = [];

                  if (filters.category_id) {
                        params.push(filters.category_id);
                        query += ` AND category_id = $${params.length}`;
                  }

                  if (filters.location) {
                        params.push(`%${filters.location}%`);
                        query += ` AND location ILIKE $${params.length}`;
                  }

                  if (filters.job_type) {
                        params.push(filters.job_type);
                        query += ` AND job_type = $${params.length}`;
                  }

                  if (filters.remote === true || filters.remote === 'true') {
                        query += ` AND remote = true`;
                  }

                  // Add pagination
                  params.push(limit);
                  params.push(offset);
                  query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

                  const result = await pool.query(query, params);

                  // Get total count
                  let countQuery = 'SELECT COUNT(*) FROM jobs WHERE is_deleted = false';
                  const countParams = [];

                  if (filters.category_id) {
                        countParams.push(filters.category_id);
                        countQuery += ` AND category_id = $${countParams.length}`;
                  }

                  if (filters.location) {
                        countParams.push(`%${filters.location}%`);
                        countQuery += ` AND location ILIKE $${countParams.length}`;
                  }

                  const countResult = await pool.query(countQuery, countParams);
                  const total = parseInt(countResult.rows[0].count);

                  return {
                        success: true,
                        data: result.rows,
                        pagination: {
                              page,
                              limit,
                              total,
                              pages: Math.ceil(total / limit)
                        }
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch jobs: ${error.message}`);
            }
      },

      /**
       * Search jobs by keyword
       */
      async searchJobs(keyword, page = 1, limit = 10) {
            try {
                  const offset = (page - 1) * limit;
                  const searchTerm = `%${keyword}%`;
                  const params = [searchTerm, searchTerm, searchTerm, limit, offset];

                  const query = `
        SELECT * FROM jobs 
        WHERE is_deleted = false AND (
          title ILIKE $1 OR 
          description ILIKE $2 OR 
          location ILIKE $3
        )
        ORDER BY created_at DESC 
        LIMIT $4 OFFSET $5
      `;

                  const result = await pool.query(query, params);

                  // Count total
                  const countParams = [searchTerm, searchTerm, searchTerm];
                  const countQuery = `
        SELECT COUNT(*) FROM jobs 
        WHERE is_deleted = false AND (
          title ILIKE $1 OR 
          description ILIKE $2 OR 
          location ILIKE $3
        )
      `;

                  const countResult = await pool.query(countQuery, countParams);
                  const total = parseInt(countResult.rows[0].count);

                  return {
                        success: true,
                        data: result.rows,
                        pagination: {
                              page,
                              limit,
                              total,
                              pages: Math.ceil(total / limit)
                        }
                  };
            } catch (error) {
                  throw new Error(`Search failed: ${error.message}`);
            }
      },

      /**
       * Get job by ID
       */
      async getJobById(jobId) {
            try {
                  const query = `
        SELECT j.* FROM jobs j 
        WHERE j.id = $1 AND j.is_deleted = false
      `;
                  const result = await pool.query(query, [jobId]);

                  if (result.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  return result.rows[0];
            } catch (error) {
                  throw new Error(`Failed to get job: ${error.message}`);
            }
      },

      /**
       * Create a new job (with subscription limit check)
       */
      async createJob(userId, jobData) {
            const client = await pool.connect();

            try {
                  await client.query('BEGIN');

                  // Check subscription limits
                  const subQuery = `
        SELECT sp.job_posts_limit FROM company_subscriptions cs
        JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE cs.user_id = $1 AND cs.subscription_status = 'active'
      `;
                  const subResult = await client.query(subQuery, [userId]);

                  if (subResult.rows.length === 0) {
                        // User has no active subscription, check if Basic plan allows
                        const basicQuery = `SELECT job_posts_limit FROM subscription_plans WHERE name = 'Basic'`;
                        const basicResult = await client.query(basicQuery);
                        const limit = basicResult.rows[0]?.job_posts_limit || 0;

                        if (limit === 0) {
                              throw new Error('You must have an active subscription to post jobs');
                        }

                        // Check count
                        const countQuery = `SELECT COUNT(*) FROM jobs WHERE employer_id = $1 AND is_deleted = false`;
                        const countResult = await client.query(countQuery, [userId]);
                        const currentCount = parseInt(countResult.rows[0].count);

                        if (currentCount >= limit) {
                              throw new Error(`You have reached your job posting limit (${limit} jobs)`);
                        }
                  } else {
                        // User has subscription, check limit
                        const limit = subResult.rows[0].job_posts_limit;

                        if (limit === -1) {
                              // Unlimited
                        } else {
                              const countQuery = `SELECT COUNT(*) FROM jobs WHERE employer_id = $1 AND is_deleted = false`;
                              const countResult = await client.query(countQuery, [userId]);
                              const currentCount = parseInt(countResult.rows[0].count);

                              if (currentCount >= limit) {
                                    throw new Error(`You have reached your job posting limit (${limit} jobs). Please upgrade your plan.`);
                              }
                        }
                  }

                  // Create job
                  const insertQuery = `
        INSERT INTO jobs (
          employer_id,
          title,
          description,
          requirements,
          category_id,
          job_type,
          experience_level,
          salary_min,
          salary_max,
          location,
          remote,
          skills_required,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `;

                  const values = [
                        userId,
                        jobData.title,
                        jobData.description,
                        jobData.requirements || null,
                        jobData.category_id,
                        jobData.job_type,
                        jobData.experience_level,
                        jobData.salary_min || null,
                        jobData.salary_max || null,
                        jobData.location,
                        jobData.remote || false,
                        JSON.stringify(jobData.skills_required || [])
                  ];

                  const result = await client.query(insertQuery, values);

                  await client.query('COMMIT');

                  return {
                        success: true,
                        message: 'Job created successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  await client.query('ROLLBACK');
                  throw new Error(`Failed to create job: ${error.message}`);
            } finally {
                  client.release();
            }
      },

      /**
       * Update a job
       */
      async updateJob(jobId, userId, jobData) {
            try {
                  // Verify job belongs to user
                  const jobQuery = `SELECT employer_id FROM jobs WHERE id = $1`;
                  const jobResult = await pool.query(jobQuery, [jobId]);

                  if (jobResult.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  if (jobResult.rows[0].employer_id !== userId) {
                        throw new Error('Unauthorized: You can only edit your own jobs');
                  }

                  const updateQuery = `
        UPDATE jobs SET
          title = $1,
          description = $2,
          requirements = $3,
          category_id = $4,
          job_type = $5,
          experience_level = $6,
          salary_min = $7,
          salary_max = $8,
          location = $9,
          remote = $10,
          skills_required = $11,
          updated_at = NOW()
        WHERE id = $12
        RETURNING *
      `;

                  const values = [
                        jobData.title,
                        jobData.description,
                        jobData.requirements || null,
                        jobData.category_id,
                        jobData.job_type,
                        jobData.experience_level,
                        jobData.salary_min || null,
                        jobData.salary_max || null,
                        jobData.location,
                        jobData.remote || false,
                        JSON.stringify(jobData.skills_required || []),
                        jobId
                  ];

                  const result = await pool.query(updateQuery, values);

                  return {
                        success: true,
                        message: 'Job updated successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  throw new Error(`Failed to update job: ${error.message}`);
            }
      },

      /**
       * Delete a job (soft delete)
       */
      async deleteJob(jobId, userId) {
            try {
                  // Verify ownership
                  const jobQuery = `SELECT employer_id FROM jobs WHERE id = $1`;
                  const jobResult = await pool.query(jobQuery, [jobId]);

                  if (jobResult.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  if (jobResult.rows[0].employer_id !== userId) {
                        throw new Error('Unauthorized: You can only delete your own jobs');
                  }

                  const deleteQuery = `
        UPDATE jobs SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 RETURNING *
      `;

                  const result = await pool.query(deleteQuery, [jobId]);

                  return {
                        success: true,
                        message: 'Job deleted successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  throw new Error(`Failed to delete job: ${error.message}`);
            }
      },

      /**
       * Publish a job
       */
      async publishJob(jobId, userId) {
            try {
                  const jobQuery = `SELECT employer_id FROM jobs WHERE id = $1`;
                  const jobResult = await pool.query(jobQuery, [jobId]);

                  if (jobResult.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  if (jobResult.rows[0].employer_id !== userId) {
                        throw new Error('Unauthorized');
                  }

                  const updateQuery = `
        UPDATE jobs SET status = 'active', published_at = NOW(), updated_at = NOW()
        WHERE id = $1 RETURNING *
      `;

                  const result = await pool.query(updateQuery, [jobId]);

                  return {
                        success: true,
                        message: 'Job published successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  throw new Error(`Failed to publish job: ${error.message}`);
            }
      },

      /**
       * Close a job (stop accepting applications)
       */
      async closeJob(jobId, userId) {
            try {
                  const jobQuery = `SELECT employer_id FROM jobs WHERE id = $1`;
                  const jobResult = await pool.query(jobQuery, [jobId]);

                  if (jobResult.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  if (jobResult.rows[0].employer_id !== userId) {
                        throw new Error('Unauthorized');
                  }

                  const updateQuery = `
        UPDATE jobs SET status = 'closed', updated_at = NOW()
        WHERE id = $1 RETURNING *
      `;

                  const result = await pool.query(updateQuery, [jobId]);

                  return {
                        success: true,
                        message: 'Job closed successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  throw new Error(`Failed to close job: ${error.message}`);
            }
      },

      /**
       * Feature a job (with subscription limit check)
       */
      async featureJob(jobId, userId) {
            const client = await pool.connect();

            try {
                  await client.query('BEGIN');

                  // Verify ownership
                  const jobQuery = `SELECT employer_id FROM jobs WHERE id = $1`;
                  const jobResult = await client.query(jobQuery, [jobId]);

                  if (jobResult.rows.length === 0) {
                        throw new Error('Job not found');
                  }

                  if (jobResult.rows[0].employer_id !== userId) {
                        throw new Error('Unauthorized');
                  }

                  // Check subscription limits
                  const subQuery = `
        SELECT sp.featured_jobs_limit FROM company_subscriptions cs
        JOIN subscription_plans sp ON cs.plan_id = sp.id
        WHERE cs.user_id = $1 AND cs.subscription_status = 'active'
      `;
                  const subResult = await client.query(subQuery, [userId]);

                  if (subResult.rows.length === 0) {
                        throw new Error('You must have an active subscription to feature jobs');
                  }

                  const limit = subResult.rows[0].featured_jobs_limit;

                  if (limit === 0) {
                        throw new Error('Your current plan does not allow featured jobs');
                  }

                  if (limit !== -1) {
                        // Check current featured count
                        const countQuery = `
          SELECT COUNT(*) FROM jobs 
          WHERE employer_id = $1 AND is_deleted = false AND is_featured = true
        `;
                        const countResult = await client.query(countQuery, [userId]);
                        const currentCount = parseInt(countResult.rows[0].count);

                        if (currentCount >= limit) {
                              throw new Error(`You have reached your featured jobs limit (${limit} jobs). Please upgrade your plan.`);
                        }
                  }

                  // Feature the job
                  const updateQuery = `
        UPDATE jobs SET is_featured = true, featured_at = NOW(), updated_at = NOW()
        WHERE id = $1 RETURNING *
      `;

                  const result = await client.query(updateQuery, [jobId]);

                  await client.query('COMMIT');

                  return {
                        success: true,
                        message: 'Job featured successfully',
                        data: result.rows[0]
                  };
            } catch (error) {
                  await client.query('ROLLBACK');
                  throw new Error(`Failed to feature job: ${error.message}`);
            } finally {
                  client.release();
            }
      },

      /**
       * Get employer's jobs
       */
      async getEmployerJobs(userId, page = 1, limit = 10) {
            try {
                  const offset = (page - 1) * limit;

                  const query = `
        SELECT * FROM jobs 
        WHERE employer_id = $1 AND is_deleted = false
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `;

                  const result = await pool.query(query, [userId, limit, offset]);

                  // Get total count
                  const countQuery = `
        SELECT COUNT(*) FROM jobs 
        WHERE employer_id = $1 AND is_deleted = false
      `;

                  const countResult = await pool.query(countQuery, [userId]);
                  const total = parseInt(countResult.rows[0].count);

                  return {
                        success: true,
                        data: result.rows,
                        pagination: {
                              page,
                              limit,
                              total,
                              pages: Math.ceil(total / limit)
                        }
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch employer jobs: ${error.message}`);
            }
      },

      /**
       * Get featured jobs
       */
      async getFeaturedJobs(limit = 10) {
            try {
                  const query = `
        SELECT * FROM jobs 
        WHERE is_featured = true AND is_deleted = false AND status = 'active'
        ORDER BY featured_at DESC 
        LIMIT $1
      `;

                  const result = await pool.query(query, [limit]);

                  return {
                        success: true,
                        data: result.rows
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch featured jobs: ${error.message}`);
            }
      },

      /**
       * Get top featured jobs
       */
      async getTopFeaturedJobs(limit = 5) {
            try {
                  const query = `
        SELECT * FROM jobs 
        WHERE is_featured = true AND is_deleted = false AND status = 'active'
        ORDER BY featured_at DESC, created_at DESC
        LIMIT $1
      `;

                  const result = await pool.query(query, [limit]);

                  return {
                        success: true,
                        data: result.rows
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch top featured jobs: ${error.message}`);
            }
      },

      /**
       * Get featured jobs by category
       */
      async getFeaturedJobsByCategory(categoryId, limit = 10) {
            try {
                  const query = `
        SELECT * FROM jobs 
        WHERE is_featured = true AND is_deleted = false AND status = 'active' 
        AND category_id = $1
        ORDER BY featured_at DESC 
        LIMIT $2
      `;

                  const result = await pool.query(query, [categoryId, limit]);

                  return {
                        success: true,
                        data: result.rows
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch jobs by category: ${error.message}`);
            }
      },

      /**
       * Get featured jobs by location
       */
      async getFeaturedJobsByLocation(location, limit = 10) {
            try {
                  const query = `
        SELECT * FROM jobs 
        WHERE is_featured = true AND is_deleted = false AND status = 'active' 
        AND location ILIKE $1
        ORDER BY featured_at DESC 
        LIMIT $2
      `;

                  const result = await pool.query(query, [`%${location}%`, limit]);

                  return {
                        success: true,
                        data: result.rows
                  };
            } catch (error) {
                  throw new Error(`Failed to fetch jobs by location: ${error.message}`);
            }
      },

      /**
       * Search featured jobs
       */
      async searchFeaturedJobs(keyword, limit = 10) {
            try {
                  const searchTerm = `%${keyword}%`;

                  const query = `
        SELECT * FROM jobs 
        WHERE is_featured = true AND is_deleted = false AND status = 'active' 
        AND (title ILIKE $1 OR description ILIKE $1 OR location ILIKE $1)
        ORDER BY featured_at DESC 
        LIMIT $2
      `;

                  const result = await pool.query(query, [searchTerm, limit]);

                  return {
                        success: true,
                        data: result.rows
                  };
            } catch (error) {
                  throw new Error(`Failed to search featured jobs: ${error.message}`);
            }
      }
};