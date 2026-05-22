import subscriptionService from '../services/subscriptionService.js';
import jobService from '../services/jobService.js';
import { successResponse } from '../utils/helpers.js';

export class SubscriptionController {
      // ==================== PLAN ENDPOINTS ====================

      async getPlans(req, res, next) {
            try {
                  const plans = await subscriptionService.getAllPlans();
                  return successResponse(res, 200, 'Subscription plans retrieved successfully', plans);
            } catch (error) {
                  next(error);
            }
      }

      async getPlan(req, res, next) {
            try {
                  const plan = await subscriptionService.getPlanById(req.params.id);
                  return successResponse(res, 200, 'Plan details retrieved successfully', plan);
            } catch (error) {
                  next(error);
            }
      }

      // ==================== SUBSCRIPTION ENDPOINTS ====================

      async getMySubscription(req, res, next) {
            try {
                  const subscription = await subscriptionService.getSubscription(req.user.id);
                  return successResponse(res, 200, 'Subscription details retrieved successfully', subscription);
            } catch (error) {
                  next(error);
            }
      }

      async createSubscription(req, res, next) {
            try {
                  const { plan_id, billing_cycle = 'monthly' } = req.body;

                  const subscription = await subscriptionService.createSubscription(
                        req.user.id,
                        plan_id,
                        billing_cycle
                  );

                  const plan = await subscriptionService.getPlanById(plan_id);

                  return successResponse(res, 201, 'Subscription created successfully', {
                        subscription,
                        plan
                  });
            } catch (error) {
                  next(error);
            }
      }

      async upgradeSubscription(req, res, next) {
            try {
                  const { plan_id, billing_cycle = 'monthly' } = req.body;

                  const subscription = await subscriptionService.upgradeSubscription(
                        req.user.id,
                        plan_id,
                        billing_cycle
                  );

                  return successResponse(res, 200, 'Subscription upgraded successfully', subscription);
            } catch (error) {
                  next(error);
            }
      }

      async downgradeSubscription(req, res, next) {
            try {
                  const { plan_id, billing_cycle = 'monthly' } = req.body;

                  const subscription = await subscriptionService.downgradeSubscription(
                        req.user.id,
                        plan_id,
                        billing_cycle
                  );

                  return successResponse(res, 200, 'Subscription downgrade scheduled successfully', subscription);
            } catch (error) {
                  next(error);
            }
      }

      async cancelSubscription(req, res, next) {
            try {
                  const { reason } = req.body;

                  const subscription = await subscriptionService.cancelSubscription(
                        req.user.id,
                        reason
                  );

                  return successResponse(res, 200, 'Subscription cancelled successfully', subscription);
            } catch (error) {
                  next(error);
            }
      }

      async renewSubscription(req, res, next) {
            try {
                  const subscription = await subscriptionService.renewSubscription(req.user.id);
                  return successResponse(res, 200, 'Subscription renewed successfully', subscription);
            } catch (error) {
                  next(error);
            }
      }

      // ==================== LIMITS CHECK ====================

      async checkPostingLimit(req, res, next) {
            try {
                  const limitStatus = await subscriptionService.checkJobPostingLimit(req.user.id);
                  return successResponse(res, 200, 'Posting limit checked', limitStatus);
            } catch (error) {
                  next(error);
            }
      }

      async checkFeaturedLimit(req, res, next) {
            try {
                  const limitStatus = await subscriptionService.checkFeaturedJobLimit(req.user.id);
                  return successResponse(res, 200, 'Featured limit checked', limitStatus);
            } catch (error) {
                  next(error);
            }
      }

      // ==================== TRANSACTIONS ====================

      async getTransactions(req, res, next) {
            try {
                  const { page = 1, limit = 10 } = req.query;
                  const transactions = await subscriptionService.getTransactions(req.user.id, page, limit);
                  return successResponse(res, 200, 'Transactions retrieved successfully', transactions);
            } catch (error) {
                  next(error);
            }
      }

      async completePayment(req, res, next) {
            try {
                  const { transaction_id } = req.params;
                  const transaction = await subscriptionService.completeTransaction(transaction_id);
                  return successResponse(res, 200, 'Payment completed successfully', transaction);
            } catch (error) {
                  next(error);
            }
      }

      // ==================== USAGE TRACKING ====================

      async getUsageHistory(req, res, next) {
            try {
                  const { page = 1, limit = 20 } = req.query;
                  const usage = await subscriptionService.getUsageHistory(req.user.id, page, limit);
                  return successResponse(res, 200, 'Usage history retrieved successfully', usage);
            } catch (error) {
                  next(error);
            }
      }

      // ==================== ADMIN ENDPOINTS ====================

      async getAllSubscriptions(req, res, next) {
            try {
                  const { page = 1, limit = 20 } = req.query;
                  const subscriptions = await subscriptionService.getAllSubscriptions(page, limit);
                  return successResponse(res, 200, 'All subscriptions retrieved successfully', subscriptions);
            } catch (error) {
                  next(error);
            }
      }

      async getSubscriptionStats(req, res, next) {
            try {
                  const stats = await subscriptionService.getSubscriptionStats();
                  return successResponse(res, 200, 'Subscription statistics retrieved', stats);
            } catch (error) {
                  next(error);
            }
      }

      async getRevenueStats(req, res, next) {
            try {
                  const revenue = await subscriptionService.getRevenueStats();
                  return successResponse(res, 200, 'Revenue statistics retrieved', revenue);
            } catch (error) {
                  next(error);
            }
      }
}

export default new SubscriptionController();