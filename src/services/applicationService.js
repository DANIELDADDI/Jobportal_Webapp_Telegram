import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/helpers.js';

export class ApplicationService {
      async applyForJob(jobId, applicantId, applicationData) {
            const { cover_letter, resume_url } = applicationData;

            // Check if job exists and is published
            const jobResult = await query(
                  'SELECT id, employer_id FROM jobs WHERE id = $1 AND status = $2',
                  [jobId, 'published']
            );

            if (jobResult.rows.length === 0) {
                  throw new AppError('Job not found or is not available', 404);
            }

            const job = jobResult.rows[0];

            // Check if user already applied
            const existingApplication = await query(
                  'SELECT id FROM job_applications WHERE job_id = $1 AND applicant_id = $2',
                  [jobId, applicantId]
            );

            if (existingApplication.rows.length > 0) {
                  throw new AppError('You have already applied for this job', 400);
            }

            // Create application
            const result = await query(
                  `INSERT INTO job_applications (job_id, applicant_id, employer_id, cover_letter, resume_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
                  [jobId, applicantId, job.employer_id, cover_letter || null, resume_url || null]
            );

            // Increment applications count
            await query(
                  'UPDATE jobs SET applications_count = applications_count + 1 WHERE id = $1',
                  [jobId]
            );

            return result.rows[0];
      }

      async getApplicationById(applicationId) {
            const result = await query(
                  `SELECT ja.*, 
              j.title as job_title,
              u.first_name, u.last_name, u.email,
              emp.first_name as employer_first_name, emp.last_name as employer_last_name
       FROM job_applications ja
       LEFT JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users u ON ja.applicant_id = u.id
       LEFT JOIN users emp ON ja.employer_id = emp.id
       WHERE ja.id = $1`,
                  [applicationId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Application not found', 404);
            }

            return result.rows[0];
      }

      async getJobApplications(jobId, employerId, page = 1, limit = 10) {
            // Verify job ownership
            const jobResult = await query(
                  'SELECT id FROM jobs WHERE id = $1 AND employer_id = $2',
                  [jobId, employerId]
            );

            if (jobResult.rows.length === 0) {
                  throw new AppError('Job not found or you do not have permission', 404);
            }

            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query(
                  'SELECT COUNT(*) FROM job_applications WHERE job_id = $1',
                  [jobId]
            );
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT ja.*, 
              u.first_name, u.last_name, u.email, u.phone
       FROM job_applications ja
       LEFT JOIN users u ON ja.applicant_id = u.id
       WHERE ja.job_id = $1
       ORDER BY ja.applied_at DESC
       LIMIT $2 OFFSET $3`,
                  [jobId, limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      async getUserApplications(userId, page = 1, limit = 10) {
            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query(
                  'SELECT COUNT(*) FROM job_applications WHERE applicant_id = $1',
                  [userId]
            );
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT ja.*, 
              j.title as job_title, j.location,
              u.first_name, u.last_name,
              cp.company_name, cp.logo_url
       FROM job_applications ja
       LEFT JOIN jobs j ON ja.job_id = j.id
       LEFT JOIN users u ON j.employer_id = u.id
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       WHERE ja.applicant_id = $1
       ORDER BY ja.applied_at DESC
       LIMIT $2 OFFSET $3`,
                  [userId, limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      async updateApplicationStatus(applicationId, employerId, statusData) {
            const { status, rating, feedback } = statusData;

            // Verify employer ownership
            const appResult = await query(
                  'SELECT id FROM job_applications WHERE id = $1 AND employer_id = $2',
                  [applicationId, employerId]
            );

            if (appResult.rows.length === 0) {
                  throw new AppError('Application not found or you do not have permission', 404);
            }

            const result = await query(
                  `UPDATE job_applications SET
        status = COALESCE($1, status),
        rating = COALESCE($2, rating),
        feedback = COALESCE($3, feedback),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
                  [status, rating, feedback, applicationId]
            );

            return result.rows[0];
      }

      async rejectApplication(applicationId, employerId) {
            return this.updateApplicationStatus(applicationId, employerId, { status: 'rejected' });
      }

      async shortlistApplication(applicationId, employerId) {
            return this.updateApplicationStatus(applicationId, employerId, { status: 'shortlisted' });
      }

      async scheduleInterview(applicationId, employerId) {
            return this.updateApplicationStatus(applicationId, employerId, { status: 'interview' });
      }

      async makeOffer(applicationId, employerId) {
            return this.updateApplicationStatus(applicationId, employerId, { status: 'offered' });
      }

      async withdrawApplication(applicationId, userId) {
            const appResult = await query(
                  'SELECT job_id FROM job_applications WHERE id = $1 AND applicant_id = $2',
                  [applicationId, userId]
            );

            if (appResult.rows.length === 0) {
                  throw new AppError('Application not found', 404);
            }

            const jobId = appResult.rows[0].job_id;

            await query('DELETE FROM job_applications WHERE id = $1', [applicationId]);

            // Decrement applications count
            await query(
                  'UPDATE jobs SET applications_count = applications_count - 1 WHERE id = $1',
                  [jobId]
            );

            return { message: 'Application withdrawn successfully' };
      }
}

export default new ApplicationService();