import authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export class AuthController {
      async register(req, res, next) {
            try {
                  const result = await authService.register(req.body);
                  return successResponse(res, 201, 'User registered successfully', {
                        user: result.user,
                        token: result.token
                  });
            } catch (error) {
                  next(error);
            }
      }

      async login(req, res, next) {
            try {
                  const { email, password } = req.body;
                  const result = await authService.login(email, password);
                  return successResponse(res, 200, 'Login successful', {
                        user: result.user,
                        token: result.token
                  });
            } catch (error) {
                  next(error);
            }
      }

      async getProfile(req, res, next) {
            try {
                  const user = await authService.getUserById(req.user.id);
                  return successResponse(res, 200, 'Profile retrieved successfully', user);
            } catch (error) {
                  next(error);
            }
      }

      async updateProfile(req, res, next) {
            try {
                  const user = await authService.updateProfile(req.user.id, req.body);
                  return successResponse(res, 200, 'Profile updated successfully', user);
            } catch (error) {
                  next(error);
            }
      }

      async changePassword(req, res, next) {
            try {
                  const { oldPassword, newPassword } = req.body;
                  const result = await authService.changePassword(req.user.id, oldPassword, newPassword);
                  return successResponse(res, 200, result.message);
            } catch (error) {
                  next(error);
            }
      }
}

export default new AuthController();