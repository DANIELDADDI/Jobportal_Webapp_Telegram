

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  profile_picture VARCHAR(500),
  bio TEXT,
  user_type VARCHAR(20) CHECK (user_type IN ('jobseeker', 'employer', 'admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Job Categories Table
CREATE TABLE IF NOT EXISTS job_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES job_categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'KWD',
  job_type VARCHAR(50) CHECK (job_type IN ('Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Temporary')),
  experience_level VARCHAR(50) CHECK (experience_level IN ('Entry-Level', 'Mid-Level', 'Senior', 'Executive')),
  location VARCHAR(255),
  remote BOOLEAN DEFAULT false,
  skills_required TEXT ARRAY,
  status VARCHAR(20) CHECK (status IN ('draft', 'published', 'closed', 'archived')) DEFAULT 'draft',
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);




-- Job Applications Table
CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  applicant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cover_letter TEXT,
  resume_url VARCHAR(500),
  status VARCHAR(50) CHECK (status IN ('pending', 'reviewed', 'shortlisted', 'rejected', 'interview', 'offered', 'hired')) DEFAULT 'pending',
  rating INTEGER,
  feedback TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(job_id, applicant_id)
);






-- User Skills Table
CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  endorsed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);







-- Company Profiles Table
CREATE TABLE IF NOT EXISTS company_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  company_website VARCHAR(500),
  company_description TEXT,
  company_size VARCHAR(50),
  industry VARCHAR(100),
  logo_url VARCHAR(500),
  cover_image_url VARCHAR(500),
  location VARCHAR(255),
  phone VARCHAR(20),
  established_year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);






-- Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);






-- Contact Messages Table
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) CHECK (status IN ('new', 'read', 'replied', 'closed')) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);





-- User Reviews Table
CREATE TABLE IF NOT EXISTS user_reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(reviewer_id, reviewed_user_id)
);





-- Create indexes for better performance
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_category_id ON jobs(category_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_applications_employer_id ON job_applications(employer_id);
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);