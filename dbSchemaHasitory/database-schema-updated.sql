-- ========================================
-- KUWAIT JOB PORTAL - UPDATED SCHEMA
-- WITH SUBSCRIPTION SYSTEM
-- ========================================

-- Users Table (Existing - No changes)
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

-- Job Categories Table (Existing - No changes)
CREATE TABLE IF NOT EXISTS job_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEW: SUBSCRIPTION PLANS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE CHECK (name IN ('Basic', 'Standard', 'Premium')),
  description TEXT,
  price_monthly DECIMAL(10, 2),
  price_yearly DECIMAL(10, 2),
  job_posts_limit INTEGER NOT NULL, -- -1 for unlimited
  featured_jobs_limit INTEGER NOT NULL DEFAULT 0, -- 0 for none
  is_free BOOLEAN DEFAULT false,
  features TEXT ARRAY DEFAULT ARRAY[]::TEXT[], -- List of features
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans 
  (name, description, price_monthly, price_yearly, job_posts_limit, featured_jobs_limit, is_free, features)
VALUES 
  ('Basic', 
   'Free plan for first-time employers with limited job postings',
   0.00, 0.00, 5, 0, true,
   ARRAY['5 job postings per month', 'Basic company profile', 'Job analytics', 'Email support']),
  
  ('Standard',
   'Paid plan with moderate job posting limits and features',
   29.99, 299.99, 25, 3, false,
   ARRAY['25 job postings per month', 'Featured job listings', 'Advanced company profile', 'Priority email support', 'Job analytics dashboard', 'Candidate screening tools']),
  
  ('Premium',
   'Unlimited posting plan with all premium features',
   99.99, 999.99, -1, 10, false,
   ARRAY['Unlimited job postings', '10 featured jobs per month', 'Priority support', 'Advanced analytics', 'Candidate database access', 'API access', 'Custom branding', 'Dedicated account manager']);

-- ========================================
-- NEW: COMPANY SUBSCRIPTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id SERIAL PRIMARY KEY,
  employer_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  billing_cycle VARCHAR(10) CHECK (billing_cycle IN ('monthly', 'yearly')) DEFAULT 'monthly',
  
  -- Subscription status tracking
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'cancelled', 'expired')) DEFAULT 'inactive',
  
  -- Job posting tracking
  job_posts_used INTEGER DEFAULT 0,
  featured_posts_used INTEGER DEFAULT 0,
  
  -- Dates
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  next_billing_date TIMESTAMP,
  cancelled_at TIMESTAMP,
  
  -- Payment information
  payment_method VARCHAR(50), -- 'credit_card', 'bank_transfer', 'wallet'
  auto_renewal BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEW: SUBSCRIPTION TRANSACTIONS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  
  -- Transaction details
  transaction_type VARCHAR(20) CHECK (transaction_type IN ('subscription', 'renewal', 'upgrade', 'downgrade', 'cancellation', 'refund')) DEFAULT 'subscription',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'KWD',
  
  -- Payment details
  payment_status VARCHAR(20) CHECK (payment_status IN ('pending', 'completed', 'failed', 'cancelled')) DEFAULT 'pending',
  payment_method VARCHAR(50),
  transaction_reference VARCHAR(100),
  
  -- Period covered
  billing_period_start TIMESTAMP,
  billing_period_end TIMESTAMP,
  
  -- Additional info
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- NEW: SUBSCRIPTION USAGE HISTORY TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS subscription_usage_history (
  id SERIAL PRIMARY KEY,
  subscription_id INTEGER NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
  employer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Usage tracking
  action_type VARCHAR(50) CHECK (action_type IN ('job_posted', 'job_featured', 'job_deleted', 'featured_expired', 'reset')) DEFAULT 'job_posted',
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  
  -- Details
  posts_before INTEGER,
  posts_after INTEGER,
  featured_before INTEGER,
  featured_after INTEGER,
  
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EXISTING: JOBS TABLE (MODIFIED)
-- ========================================
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
  
  -- Subscription-related fields
  is_featured BOOLEAN DEFAULT false,
  featured_until TIMESTAMP,
  
  applications_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP
);

-- ========================================
-- EXISTING: JOB APPLICATIONS TABLE (No changes)
-- ========================================
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

-- ========================================
-- EXISTING: USER SKILLS TABLE (No changes)
-- ========================================
CREATE TABLE IF NOT EXISTS user_skills (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name VARCHAR(100) NOT NULL,
  proficiency_level VARCHAR(20) CHECK (proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  endorsed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EXISTING: COMPANY PROFILES TABLE (MODIFIED)
-- ========================================
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
  
  -- Subscription-related
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- EXISTING: SAVED JOBS TABLE (No changes)
-- ========================================
CREATE TABLE IF NOT EXISTS saved_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, job_id)
);

-- ========================================
-- EXISTING: CONTACT MESSAGES TABLE (No changes)
-- ========================================
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

-- ========================================
-- EXISTING: USER REVIEWS TABLE (No changes)
-- ========================================
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

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Existing indexes
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_jobs_category_id ON jobs(category_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_applications_job_id ON job_applications(job_id);
CREATE INDEX idx_applications_applicant_id ON job_applications(applicant_id);
CREATE INDEX idx_applications_employer_id ON job_applications(employer_id);
CREATE INDEX idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_company_profiles_user_id ON company_profiles(user_id);

-- New subscription indexes
CREATE INDEX idx_company_subscriptions_employer_id ON company_subscriptions(employer_id);
CREATE INDEX idx_company_subscriptions_plan_id ON company_subscriptions(plan_id);
CREATE INDEX idx_company_subscriptions_status ON company_subscriptions(status);
CREATE INDEX idx_subscription_transactions_employer_id ON subscription_transactions(employer_id);
CREATE INDEX idx_subscription_transactions_subscription_id ON subscription_transactions(subscription_id);
CREATE INDEX idx_subscription_transactions_payment_status ON subscription_transactions(payment_status);
CREATE INDEX idx_subscription_usage_employer_id ON subscription_usage_history(employer_id);
CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage_history(subscription_id);
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);

-- ========================================
-- VIEWS FOR EASY QUERYING
-- ========================================

-- Current subscription status view
CREATE VIEW company_current_subscriptions AS
SELECT 
  cs.id,
  cs.employer_id,
  u.email,
  u.first_name,
  u.last_name,
  cp.company_name,
  sp.name as plan_name,
  sp.job_posts_limit,
  sp.featured_jobs_limit,
  cs.job_posts_used,
  cs.featured_posts_used,
  (sp.job_posts_limit - cs.job_posts_used) as remaining_posts,
  (sp.featured_jobs_limit - cs.featured_posts_used) as remaining_featured,
  cs.status,
  cs.billing_cycle,
  cs.subscription_start_date,
  cs.subscription_end_date,
  cs.next_billing_date,
  CASE 
    WHEN cs.subscription_end_date < NOW() THEN 'EXPIRED'
    WHEN cs.subscription_end_date < NOW() + INTERVAL '7 days' THEN 'EXPIRING_SOON'
    ELSE 'ACTIVE'
  END as subscription_health
FROM company_subscriptions cs
JOIN users u ON cs.employer_id = u.id
LEFT JOIN company_profiles cp ON u.id = cp.user_id
JOIN subscription_plans sp ON cs.plan_id = sp.id
WHERE cs.status IN ('active', 'inactive');

-- Subscription revenue view
CREATE VIEW subscription_revenue AS
SELECT 
  DATE_TRUNC('month', st.created_at)::DATE as month,
  sp.name as plan_name,
  COUNT(st.id) as transaction_count,
  SUM(CASE WHEN st.payment_status = 'completed' THEN st.amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN st.payment_status = 'pending' THEN st.amount ELSE 0 END) as pending_amount,
  SUM(CASE WHEN st.payment_status = 'failed' THEN st.amount ELSE 0 END) as failed_amount
FROM subscription_transactions st
JOIN subscription_plans sp ON st.plan_id = sp.id
GROUP BY DATE_TRUNC('month', st.created_at), sp.name
ORDER BY month DESC;