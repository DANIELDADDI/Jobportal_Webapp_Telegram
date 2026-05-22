import Joi from 'joi';

export const validate = (schema, property = 'body') => {
      return (req, res, next) => {
            const { error, value } = schema.validate(req[property], {
                  abortEarly: false,
                  stripUnknown: true
            });

            if (error) {
                  const formattedErrors = error.details.map(detail => ({
                        field: detail.path.join('.'),
                        message: detail.message
                  }));

                  return res.status(400).json({
                        success: false,
                        message: 'Validation error',
                        errors: formattedErrors
                  });
            }

            req[property] = value;
            next();
      };
};






// Validation Schemas
export const schemas = {
      // Auth Schemas
      registerSchema: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().min(6).required(),
            first_name: Joi.string().required(),
            last_name: Joi.string().required(),
            user_type: Joi.string().valid('jobseeker', 'employer').required(),
            phone: Joi.string().optional()
      }),

      loginSchema: Joi.object({
            email: Joi.string().email().required(),
            password: Joi.string().required()
      }),





      // Job Schemas
      createJobSchema: Joi.object({
            title: Joi.string().required(),
            description: Joi.string().required(),
            category_id: Joi.number().required(),
            job_type: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Temporary').required(),
            experience_level: Joi.string().valid('Entry-Level', 'Mid-Level', 'Senior', 'Executive'),
            salary_min: Joi.number().min(0),
            salary_max: Joi.number().min(0),
            location: Joi.string(),
            remote: Joi.boolean(),
            skills_required: Joi.array().items(Joi.string()),
            requirements: Joi.string()
      }),

      updateJobSchema: Joi.object({
            title: Joi.string(),
            description: Joi.string(),
            category_id: Joi.number(),
            job_type: Joi.string().valid('Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Temporary'),
            experience_level: Joi.string().valid('Entry-Level', 'Mid-Level', 'Senior', 'Executive'),
            salary_min: Joi.number().min(0),
            salary_max: Joi.number().min(0),
            location: Joi.string(),
            remote: Joi.boolean(),
            skills_required: Joi.array().items(Joi.string()),
            requirements: Joi.string(),
            status: Joi.string().valid('draft', 'published', 'closed', 'archived')
      }),





      // Application Schemas
      createApplicationSchema: Joi.object({
            job_id: Joi.number().required(),
            cover_letter: Joi.string(),
            resume_url: Joi.string()
      }),

      updateApplicationSchema: Joi.object({
            status: Joi.string().valid('pending', 'reviewed', 'shortlisted', 'rejected', 'interview', 'offered', 'hired'),
            rating: Joi.number().min(1).max(5),
            feedback: Joi.string()
      }),




      // Contact Schemas
      createContactSchema: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().required(),
            phone: Joi.string(),
            subject: Joi.string().required(),
            message: Joi.string().required()
      }),



      // Profile Schemas
      updateProfileSchema: Joi.object({
            first_name: Joi.string(),
            last_name: Joi.string(),
            phone: Joi.string(),
            bio: Joi.string()
      }),



      createCompanyProfileSchema: Joi.object({
            company_name: Joi.string().required(),
            company_website: Joi.string().uri(),
            company_description: Joi.string(),
            company_size: Joi.string(),
            industry: Joi.string(),
            location: Joi.string(),
            established_year: Joi.number()
      })
};