import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/helpers.js';

export class SubscriptionService {
      // ==================== PLAN MANAGEMENT ====================

      async getAllPlans() {
            const result = await query(
                  `SELECT * FROM subscription_plans 
       WHERE status = 'active'
       ORDER BY 
         CASE name 
           WHEN 'Basic' THEN 1 
           WHEN 'Standard' THEN 2 
           WHEN 'Premium' THEN 3 
         END`
            );
            return result.rows;
      }

      async getPlanById(planId) {
            const result = await query(
                  'SELECT * FROM subscription_plans WHERE id = $1',
                  [planId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Plan not found', 404);
            }

            return result.rows[0];
      }

      async getPlanByName(planName) {
            const result = await query(
                  'SELECT * FROM subscription_plans WHERE name = $1 AND status = $2',
                  [planName, 'active']
            );

            if (result.rows.length === 0) {
                  throw new AppError('Plan not found', 404);
            }

            return result.rows[0];
      }

      // ==================== SUBSCRIPTION MANAGEMENT ====================

      async createSubscription(employerId, planId, billingCycle = 'monthly') {
            // Check if employer already has a subscription
            const existingSubscription = await query(
                  'SELECT id FROM company_subscriptions WHERE employer_id = $1',
                  [employerId]
            );

            if (existingSubscription.rows.length > 0) {
                  throw new AppError('Employer already has an active subscription', 400);
            }

            // Verify plan exists
            const plan = await this.getPlanById(planId);

            // Calculate subscription dates
            const startDate = new Date();
            const endDate = new Date();
            if (billingCycle === 'monthly') {
                  endDate.setMonth(endDate.getMonth() + 1);
            } else {
                  endDate.setFullYear(endDate.getFullYear() + 1);
            }
            const nextBillingDate = new Date(endDate);

            // Create subscription
            const result = await query(
                  `INSERT INTO company_subscriptions 
        (employer_id, plan_id, billing_cycle, status, subscription_start_date, subscription_end_date, next_billing_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
                  [employerId, planId, billingCycle, plan.is_free ? 'active' : 'inactive', startDate, endDate, nextBillingDate]
            );

            const subscription = result.rows[0];

            // If it's a free plan, activate it immediately
            if (plan.is_free) {
                  await query(
                        'UPDATE company_subscriptions SET status = $1 WHERE id = $2',
                        ['active', subscription.id]
                  );
            }

            return subscription;
      }

      async getSubscription(employerId) {
            const result = await query(
                  `SELECT cs.*, sp.* 
       FROM company_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.employer_id = $1`,
                  [employerId]
            );

            if (result.rows.length === 0) {
                  // Auto-create basic subscription for new employers
                  const basicPlan = await this.getPlanByName('Basic');
                  return this.createSubscription(employerId, basicPlan.id, 'monthly');
            }

            return result.rows[0];
      }

      async upgradeSubscription(employerId, newPlanId, billingCycle = 'monthly') {
            // Get current subscription
            const currentSub = await query(
                  'SELECT cs.*, sp.job_posts_limit FROM company_subscriptions cs JOIN subscription_plans sp ON cs.plan_id = sp.id WHERE cs.employer_id = $1',
                  [employerId]
            );

            if (currentSub.rows.length === 0) {
                  throw new AppError('No subscription found', 404);
            }

            const current = currentSub.rows[0];
            const newPlan = await this.getPlanById(newPlanId);

            // Verify we're actually upgrading
            const planHierarchy = { 'Basic': 1, 'Standard': 2, 'Premium': 3 };
            if (planHierarchy[newPlan.name] <= planHierarchy[current.name]) {
                  throw new AppError('Cannot downgrade subscription through upgrade endpoint. Use downgrade instead.', 400);
            }

            // Calculate new dates
            const now = new Date();
            const endDate = new Date();
            if (billingCycle === 'monthly') {
                  endDate.setMonth(endDate.getMonth() + 1);
            } else {
                  endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Update subscription
            const result = await query(
                  `UPDATE company_subscriptions 
       SET plan_id = $1, billing_cycle = $2, subscription_start_date = $3, subscription_end_date = $4, 
           next_billing_date = $5, job_posts_used = 0, featured_posts_used = 0, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $6
       RETURNING *`,
                  [newPlanId, billingCycle, now, endDate, endDate, employerId]
            );

            // Log transaction
            await this.logTransaction(current.id, employerId, newPlanId, 'upgrade',
                  newPlan.price_monthly || newPlan.price_yearly, 'pending');

            return result.rows[0];
      }

      async downgradeSubscription(employerId, newPlanId, billingCycle = 'monthly') {
            // Get current subscription
            const currentSub = await query(
                  'SELECT cs.*, sp.name FROM company_subscriptions cs JOIN subscription_plans sp ON cs.plan_id = sp.id WHERE cs.employer_id = $1',
                  [employerId]
            );

            if (currentSub.rows.length === 0) {
                  throw new AppError('No subscription found', 404);
            }

            const current = currentSub.rows[0];
            const newPlan = await this.getPlanById(newPlanId);

            // Verify we're actually downgrading
            const planHierarchy = { 'Basic': 1, 'Standard': 2, 'Premium': 3 };
            if (planHierarchy[newPlan.name] >= planHierarchy[current.name]) {
                  throw new AppError('Cannot upgrade subscription through downgrade endpoint. Use upgrade instead.', 400);
            }

            // Calculate new dates (downgrade takes effect at next billing cycle)
            const nextBilling = new Date(current.next_billing_date);
            const endDate = new Date(nextBilling);
            if (billingCycle === 'monthly') {
                  endDate.setMonth(endDate.getMonth() + 1);
            } else {
                  endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // Update subscription (takes effect at next billing)
            const result = await query(
                  `UPDATE company_subscriptions 
       SET plan_id = $1, billing_cycle = $2, subscription_end_date = $3, 
           next_billing_date = $4, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $5
       RETURNING *`,
                  [newPlanId, billingCycle, endDate, endDate, employerId]
            );

            // Log transaction
            await this.logTransaction(current.id, employerId, newPlanId, 'downgrade', 0, 'pending');

            return result.rows[0];
      }

      async cancelSubscription(employerId, reason = null) {
            const result = await query(
                  `UPDATE company_subscriptions 
       SET status = $1, cancelled_at = CURRENT_TIMESTAMP, auto_renewal = false, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $3
       RETURNING *`,
                  ['cancelled', reason, employerId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Subscription not found', 404);
            }

            return result.rows[0];
      }

      async renewSubscription(employerId) {
            const subscription = await query(
                  'SELECT * FROM company_subscriptions WHERE employer_id = $1',
                  [employerId]
            );

            if (subscription.rows.length === 0) {
                  throw new AppError('Subscription not found', 404);
            }

            const sub = subscription.rows[0];
            const newEndDate = new Date(sub.subscription_end_date);

            if (sub.billing_cycle === 'monthly') {
                  newEndDate.setMonth(newEndDate.getMonth() + 1);
            } else {
                  newEndDate.setFullYear(newEndDate.getFullYear() + 1);
            }

            const result = await query(
                  `UPDATE company_subscriptions 
       SET subscription_end_date = $1, next_billing_date = $2, 
           job_posts_used = 0, featured_posts_used = 0, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $3
       RETURNING *`,
                  [newEndDate, newEndDate, employerId]
            );

            // Log transaction
            await this.logTransaction(sub.id, employerId, sub.plan_id, 'renewal',
                  (sub.billing_cycle === 'monthly' ? 29.99 : 299.99), 'pending');

            return result.rows[0];
      }

      // ==================== JOB POSTING LIMITS ====================

      async checkJobPostingLimit(employerId) {
            const result = await query(
                  `SELECT cs.*, sp.job_posts_limit, sp.is_free
       FROM company_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.employer_id = $1 AND cs.status = 'active'`,
                  [employerId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('No active subscription found', 404);
            }

            const subscription = result.rows[0];

            // Check if expired
            if (new Date(subscription.subscription_end_date) < new Date()) {
                  throw new AppError('Subscription has expired. Please renew your subscription.', 403);
            }

            // Unlimited posts
            if (subscription.job_posts_limit === -1) {
                  return { canPost: true, postsRemaining: -1, planName: subscription.plan_name };
            }

            // Limited posts
            const postsRemaining = subscription.job_posts_limit - subscription.job_posts_used;
            const canPost = postsRemaining > 0;

            if (!canPost) {
                  throw new AppError(
                        `You have reached your job posting limit (${subscription.job_posts_limit}). Please upgrade your subscription.`,
                        403
                  );
            }

            return {
                  canPost: true,
                  postsRemaining,
                  postsLimit: subscription.job_posts_limit,
                  planName: subscription.plan_name
            };
      }

      async checkFeaturedJobLimit(employerId) {
            const result = await query(
                  `SELECT cs.*, sp.featured_jobs_limit
       FROM company_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       WHERE cs.employer_id = $1 AND cs.status = 'active'`,
                  [employerId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('No active subscription found', 404);
            }

            const subscription = result.rows[0];

            // Can't feature on basic plan
            if (subscription.featured_jobs_limit === 0) {
                  throw new AppError('Your current plan does not support featured jobs. Please upgrade.', 403);
            }

            // Unlimited featured
            if (subscription.featured_jobs_limit === -1) {
                  return { canFeature: true, featuredRemaining: -1 };
            }

            // Limited featured
            const featuredRemaining = subscription.featured_jobs_limit - subscription.featured_posts_used;
            const canFeature = featuredRemaining > 0;

            if (!canFeature) {
                  throw new AppError(
                        `You have reached your featured job limit (${subscription.featured_jobs_limit}). Please upgrade.`,
                        403
                  );
            }

            return {
                  canFeature: true,
                  featuredRemaining,
                  featuredLimit: subscription.featured_jobs_limit
            };
      }

      async incrementJobPostCount(employerId) {
            const result = await query(
                  `UPDATE company_subscriptions 
       SET job_posts_used = job_posts_used + 1, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $1
       RETURNING *`,
                  [employerId]
            );

            // Log usage
            const subscription = result.rows[0];
            await this.logUsage(subscription.id, employerId, 'job_posted',
                  subscription.job_posts_used - 1, subscription.job_posts_used);

            return result.rows[0];
      }

      async incrementFeaturedPostCount(employerId, jobId) {
            const result = await query(
                  `UPDATE company_subscriptions 
       SET featured_posts_used = featured_posts_used + 1, updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $1
       RETURNING *`,
                  [employerId]
            );

            // Log usage
            const subscription = result.rows[0];
            await this.logUsage(subscription.id, employerId, 'job_featured',
                  subscription.featured_posts_used - 1, subscription.featured_posts_used, jobId);

            return result.rows[0];
      }

      async decrementJobPostCount(employerId) {
            await query(
                  `UPDATE company_subscriptions 
       SET job_posts_used = GREATEST(0, job_posts_used - 1), updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $1`,
                  [employerId]
            );
      }

      async decrementFeaturedPostCount(employerId, jobId) {
            await query(
                  `UPDATE company_subscriptions 
       SET featured_posts_used = GREATEST(0, featured_posts_used - 1), updated_at = CURRENT_TIMESTAMP
       WHERE employer_id = $1`,
                  [employerId]
            );
      }

      // ==================== TRANSACTIONS ====================

      async logTransaction(subscriptionId, employerId, planId, transactionType, amount, paymentStatus) {
            const result = await query(
                  `INSERT INTO subscription_transactions 
        (subscription_id, employer_id, plan_id, transaction_type, amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
                  [subscriptionId, employerId, planId, transactionType, amount, paymentStatus]
            );

            return result.rows[0];
      }

      async getTransactions(employerId, page = 1, limit = 10) {
            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query(
                  'SELECT COUNT(*) FROM subscription_transactions WHERE employer_id = $1',
                  [employerId]
            );
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT st.*, sp.name as plan_name
       FROM subscription_transactions st
       LEFT JOIN subscription_plans sp ON st.plan_id = sp.id
       WHERE st.employer_id = $1
       ORDER BY st.created_at DESC
       LIMIT $2 OFFSET $3`,
                  [employerId, limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      async completeTransaction(transactionId) {
            const result = await query(
                  `UPDATE subscription_transactions 
       SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
                  ['completed', transactionId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Transaction not found', 404);
            }

            // Activate subscription if payment completed
            const transaction = result.rows[0];
            await query(
                  'UPDATE company_subscriptions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                  ['active', transaction.subscription_id]
            );

            return result.rows[0];
      }

      // ==================== USAGE TRACKING ====================

      async logUsage(subscriptionId, employerId, actionType, postsBefore, postsAfter, jobId = null) {
            await query(
                  `INSERT INTO subscription_usage_history 
        (subscription_id, employer_id, action_type, job_id, posts_before, posts_after)
       VALUES ($1, $2, $3, $4, $5, $6)`,
                  [subscriptionId, employerId, actionType, jobId, postsBefore, postsAfter]
            );
      }

      async getUsageHistory(employerId, page = 1, limit = 20) {
            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query(
                  'SELECT COUNT(*) FROM subscription_usage_history WHERE employer_id = $1',
                  [employerId]
            );
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT * FROM subscription_usage_history
       WHERE employer_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
                  [employerId, limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      // ==================== ADMIN FUNCTIONS ====================

      async getAllSubscriptions(page = 1, limit = 20) {
            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query('SELECT COUNT(*) FROM company_subscriptions');
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT cs.*, u.email, u.first_name, u.last_name, cp.company_name, sp.name as plan_name
       FROM company_subscriptions cs
       JOIN users u ON cs.employer_id = u.id
       LEFT JOIN company_profiles cp ON u.id = cp.user_id
       JOIN subscription_plans sp ON cs.plan_id = sp.id
       ORDER BY cs.created_at DESC
       LIMIT $1 OFFSET $2`,
                  [limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      async getSubscriptionStats() {
            const stats = await query(
                  `SELECT 
         COUNT(DISTINCT employer_id) as total_subscribers,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_subscriptions,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_subscriptions,
         SUM(CASE WHEN sp.is_free THEN 1 ELSE 0 END) as free_plan_users
       FROM company_subscriptions cs
       JOIN subscription_plans sp ON cs.plan_id = sp.id`
            );

            return stats.rows[0];
      }

      async getRevenueStats() {
            const revenue = await query(
                  `SELECT 
         SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END) as total_revenue,
         SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END) as pending_revenue,
         COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_transactions,
         COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_transactions
       FROM subscription_transactions`
            );

            return revenue.rows[0];
      }
}

export default new SubscriptionService();