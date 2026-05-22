
import { query } from '../config/database.js';
import { hashPassword } from '../utils/helpers.js';



async function seedDatabase() {

      try {
            console.log('🌱 Starting database seeding...');

            // Clear existing data (in development only)
            console.log('Clearing existing data...');
            await query('DELETE FROM job_applications');
            await query('DELETE FROM saved_jobs');
            await query('DELETE FROM user_skills');
            await query('DELETE FROM user_reviews');
            await query('DELETE FROM jobs');
            await query('DELETE FROM company_profiles');
            await query('DELETE FROM contact_messages');
            await query('DELETE FROM job_categories');
            await query('DELETE FROM users');

            // Insert job categories
            console.log('Inserting job categories...');
            const categories = [
                  { name: 'Technology', description: 'Tech and Software jobs', icon: 'tech' },
                  { name: 'Agriculture', description: 'Agriculture and farming jobs', icon: 'agriculture' },
                  { name: 'Finance', description: 'Finance and banking jobs', icon: 'finance' },
                  { name: 'Healthcare', description: 'Medical and healthcare jobs', icon: 'healthcare' },
                  { name: 'Sales & Marketing', description: 'Sales and marketing jobs', icon: 'sales' },
                  { name: 'Education', description: 'Teaching and education jobs', icon: 'education' },
                  { name: 'Engineering', description: 'Engineering jobs', icon: 'engineering' },
                  { name: 'Hospitality', description: 'Hotel and hospitality jobs', icon: 'hospitality' }
            ];

            const categoryIds = [];
            for (const cat of categories) {
                  const result = await query(
                        'INSERT INTO job_categories (name, description, icon) VALUES ($1, $2, $3) RETURNING id',
                        [cat.name, cat.description, cat.icon]
                  );
                  categoryIds.push(result.rows[0].id);
            }




            // Insert users
            console.log('Inserting users...');
            const jobseekerPassword = await hashPassword('password123');
            const employerPassword = await hashPassword('password123');



            // Create jobseekers
            const jobseeker1 = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone, bio)
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                  ['john@example.com', jobseekerPassword, 'John', 'Doe', 'jobseeker', '+965XXXXXXXX01',
                        'Senior React Developer with 5 years experience']
            );

            const jobseeker2 = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone, bio)
                  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                  ['sarah@example.com', jobseekerPassword, 'Sarah', 'Smith', 'jobseeker', '+965XXXXXXXX02',
                        'Full Stack Developer']
            );

            const jobseeker3 = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone, bio)
                  VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                  ['ahmed@example.com', jobseekerPassword, 'Ahmed', 'Al-Rashid', 'jobseeker', '+965XXXXXXXX03',
                        'Junior Developer']
            );




            // Create employers
            const employer1 = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                  ['company1@example.com', employerPassword, 'Tech', 'Company', 'employer', '+965XXXXXXXX10']
            );

            const employer2 = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone)
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                  ['company2@example.com', employerPassword, 'Finance', 'Corp', 'employer', '+965XXXXXXXX11']
            );

            const jobseekerIds = [jobseeker1.rows[0].id, jobseeker2.rows[0].id, jobseeker3.rows[0].id];
            const employerIds = [employer1.rows[0].id, employer2.rows[0].id];





            // Insert company profiles
            console.log('Inserting company profiles...');
            await query(
                  `INSERT INTO company_profiles (user_id, company_name, company_description, company_size, industry, location, established_year)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                  [employerIds[0], 'Tech Innovation Ltd', 'Leading tech company in Middle East', '500+', 'Technology', 'Kuwait City', 2015]
            );

            await query(
                  `INSERT INTO company_profiles (user_id, company_name, company_description, company_size, industry, location, established_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                  [employerIds[1], 'Finance Solutions', 'Banking and financial services', '200-500', 'Finance', 'Kuwait City', 2010]
            );





            // Insert jobs
            console.log('Inserting jobs...');
            const jobs = [
                  {
                        employer_id: employerIds[0],
                        category_id: categoryIds[0],
                        title: 'Senior React Developer',
                        description: 'We are looking for an experienced React developer to join our growing team. You will work on cutting-edge projects.',
                        requirements: '5+ years experience with React, JavaScript, and modern web technologies',
                        salary_min: 5000,
                        salary_max: 8000,
                        job_type: 'Full-Time',
                        experience_level: 'Senior',
                        location: 'Kuwait City',
                        remote: false,
                        skills_required: ['React', 'JavaScript', 'CSS', 'Node.js']
                  },
                  {
                        employer_id: employerIds[0],
                        category_id: categoryIds[0],
                        title: 'Full Stack Developer',
                        description: 'Join our development team and build amazing web applications.',
                        requirements: '3+ years experience',
                        salary_min: 3500,
                        salary_max: 5500,
                        job_type: 'Full-Time',
                        experience_level: 'Mid-Level',
                        location: 'Kuwait City',
                        remote: true,
                        skills_required: ['Node.js', 'React', 'MongoDB', 'PostgreSQL']
                  },
                  {
                        employer_id: employerIds[0],
                        category_id: categoryIds[0],
                        title: 'Junior Frontend Developer',
                        description: 'Start your career with us as a junior frontend developer.',
                        requirements: 'Basic knowledge of HTML, CSS, JavaScript',
                        salary_min: 1500,
                        salary_max: 2500,
                        job_type: 'Full-Time',
                        experience_level: 'Entry-Level',
                        location: 'Salmiya',
                        remote: false,
                        skills_required: '{HTML, CSS, JavaScript}'
                  },
                  {
                        employer_id: employerIds[1],
                        category_id: categoryIds[2],
                        title: 'Financial Analyst',
                        description: 'Analyze financial data and provide insights for our clients.',
                        requirements: '3+ years in finance',
                        salary_min: 4000,
                        salary_max: 6000,
                        job_type: 'Full-Time',
                        experience_level: 'Mid-Level',
                        location: 'Downtown Kuwait',
                        remote: false,
                        skills_required: "{'Financial Analysis', Excel, SQL}"
                  },
                  {
                        employer_id: employerIds[1],
                        category_id: categoryIds[2],
                        title: 'Investment Manager',
                        description: 'Manage investment portfolios and advise high-net-worth clients.',
                        requirements: '7+ years experience',
                        salary_min: 7000,
                        salary_max: 10000,
                        job_type: 'Full-Time',
                        experience_level: 'Senior',
                        location: 'Kuwait City',
                        remote: false,
                        skills_required: "{'Investment Analysis', 'Risk Management', 'Client Relations'}"
                  }
            ];

            const jobIds = [];
            for (const job of jobs) {
                  const result = await query(
                        `INSERT INTO jobs (employer_id, category_id, title, description, requirements, salary_min, salary_max, 
                          job_type, experience_level, location, remote, skills_required, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
                        [job.employer_id, job.category_id, job.title, job.description, job.requirements,
                        job.salary_min, job.salary_max, job.job_type, job.experience_level, job.location,
                        job.remote, job.skills_required, 'published']
                  );
                  jobIds.push(result.rows[0].id);
            }







            // Insert job applications
            console.log('Inserting job applications...');
            const applications = [
                  {
                        job_id: jobIds[0],
                        applicant_id: jobseekerIds[0],
                        employer_id: employerIds[0],
                        cover_letter: 'I am very interested in this senior role. I have 6 years of React experience.',
                        status: 'reviewed'
                  },
                  {
                        job_id: jobIds[0],
                        applicant_id: jobseekerIds[1],
                        employer_id: employerIds[0],
                        cover_letter: 'Great opportunity to grow with your team.',
                        status: 'pending'
                  },
                  {
                        job_id: jobIds[1],
                        applicant_id: jobseekerIds[1],
                        employer_id: employerIds[0],
                        cover_letter: 'Perfect fit for this role.',
                        status: 'shortlisted'
                  },
                  {
                        job_id: jobIds[2],
                        applicant_id: jobseekerIds[2],
                        employer_id: employerIds[0],
                        cover_letter: 'Looking forward to this opportunity.',
                        status: 'pending'
                  },
                  {
                        job_id: jobIds[3],
                        applicant_id: jobseekerIds[0],
                        employer_id: employerIds[1],
                        cover_letter: 'My finance background makes me ideal for this role.',
                        status: 'interview'
                  }
            ];

            for (const app of applications) {
                  await query(
                        `INSERT INTO job_applications (job_id, applicant_id, employer_id, cover_letter, status)
         VALUES ($1, $2, $3, $4, $5)`,
                        [app.job_id, app.applicant_id, app.employer_id, app.cover_letter, app.status]
                  );
            }

            // Insert user skills
            console.log('Inserting user skills...');
            const skills = [
                  { user_id: jobseekerIds[0], skill: 'React', level: 'Expert' },
                  { user_id: jobseekerIds[0], skill: 'JavaScript', level: 'Expert' },
                  { user_id: jobseekerIds[0], skill: 'Node.js', level: 'Advanced' },
                  { user_id: jobseekerIds[1], skill: 'Full Stack Development', level: 'Advanced' },
                  { user_id: jobseekerIds[1], skill: 'React', level: 'Advanced' },
                  { user_id: jobseekerIds[2], skill: 'JavaScript', level: 'Intermediate' },
                  { user_id: jobseekerIds[2], skill: 'HTML/CSS', level: 'Intermediate' }
            ];

            for (const skill of skills) {
                  await query(
                        'INSERT INTO user_skills (user_id, skill_name, proficiency_level) VALUES ($1, $2, $3)',
                        [skill.user_id, skill.skill, skill.level]
                  );
            }






            // Insert saved jobs
            console.log('Inserting saved jobs...');
            await query(
                  'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2)',
                  [jobseekerIds[0], jobIds[0]]
            );
            await query(
                  'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2)',
                  [jobseekerIds[1], jobIds[1]]
            );
            await query(
                  'INSERT INTO saved_jobs (user_id, job_id) VALUES ($1, $2)',
                  [jobseekerIds[1], jobIds[3]]
            );






            // Insert contact messages
            console.log('Inserting contact messages...');
            const contacts = [
                  {
                        name: 'Abdullah Al-Sabah',
                        email: 'contact@example.com',
                        phone: '+965XXXXXXXX',
                        subject: 'Partnership Inquiry',
                        message: 'We would like to discuss partnership opportunities.'
                  },
                  {
                        name: 'Fatima Al-Rashid',
                        email: 'fatima@example.com',
                        phone: '+965XXXXXXXX',
                        subject: 'Job Posting',
                        message: 'How can we post job listings on your platform?'
                  },
                  {
                        name: 'Mohammed Ahmed',
                        email: 'mohammed@example.com',
                        phone: '+965XXXXXXXX',
                        subject: 'Technical Issue',
                        message: 'I am facing issues with application submission.'
                  }
            ];

            for (const contact of contacts) {
                  await query(
                        'INSERT INTO contact_messages (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5)',
                        [contact.name, contact.email, contact.phone, contact.subject, contact.message]
                  );
            }

            console.log('✅ Database seeding completed successfully!');
            console.log('\n📊 Seed Data Summary:');
            console.log(`  • ${categories.length} job categories`);
            console.log(`  • ${jobseekerIds.length} jobseekers`);
            console.log(`  • ${employerIds.length} employers`);
            console.log(`  • ${jobIds.length} job listings`);
            console.log(`  • ${applications.length} applications`);
            console.log(`  • ${skills.length} user skills`);
            console.log(`  • ${contacts.length} contact messages`);
            console.log('\n🔐 Test Credentials:');
            console.log('  Jobseeker: john@example.com / password123');
            console.log('  Employer: company1@example.com / password123');

            process.exit(0);
      } catch (error) {
            console.error('❌ Error seeding database:', error);
            process.exit(1);
      }
}

seedDatabase();