import { query } from '../config/database.js';
import { hashPassword, comparePassword, generateToken } from '../utils/helpers.js';
import { AppError } from '../middleware/errorHandler.js';

export class AuthService {
      async register(userData) {
            const { email, password, first_name, last_name, user_type, phone } = userData;

            // Check if user already exists
            const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);

            if (existingUser.rows.length > 0) {
                  throw new AppError('Email already registered', 400);
            }

            // Hash password
            const hashedPassword = await hashPassword(password);

            // Create user
            const result = await query(
                  `INSERT INTO users (email, password, first_name, last_name, user_type, phone) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, first_name, last_name, user_type`,
                  [email, hashedPassword, first_name, last_name, user_type, phone || null]
            );

            const user = result.rows[0];
            const token = generateToken(user.id, user.user_type);

            return {
                  user,
                  token
            };
      }

      async login(email, password) {
            // Find user by email
            const result = await query('SELECT * FROM users WHERE email = $1', [email]);

            if (result.rows.length === 0) {
                  throw new AppError('Invalid email or password', 401);
            }

            const user = result.rows[0];

            // Verify password
            const isPasswordValid = await comparePassword(password, user.password);

            if (!isPasswordValid) {
                  throw new AppError('Invalid email or password', 401);
            }

            // Check if user is active
            if (!user.is_active) {
                  throw new AppError('Your account has been deactivated', 403);
            }

            const token = generateToken(user.id, user.user_type);

            return {
                  user: {
                        id: user.id,
                        email: user.email,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        user_type: user.user_type,
                        phone: user.phone
                  },
                  token
            };
      }

      async getUserById(userId) {
            const result = await query(
                  `SELECT id, email, first_name, last_name, user_type, phone, bio, profile_picture, created_at, updated_at 
       FROM users WHERE id = $1 AND is_active = true`,
                  [userId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('User not found', 404);
            }

            return result.rows[0];
      }

      async updateProfile(userId, profileData) {
            const { first_name, last_name, phone, bio } = profileData;

            const result = await query(
                  `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone),
           bio = COALESCE($4, bio),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, email, first_name, last_name, user_type, phone, bio`,
                  [first_name, last_name, phone, bio, userId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('User not found', 404);
            }

            return result.rows[0];
      }

      async changePassword(userId, oldPassword, newPassword) {
            const result = await query('SELECT password FROM users WHERE id = $1', [userId]);

            if (result.rows.length === 0) {
                  throw new AppError('User not found', 404);
            }

            const user = result.rows[0];
            const isPasswordValid = await comparePassword(oldPassword, user.password);

            if (!isPasswordValid) {
                  throw new AppError('Current password is incorrect', 401);
            }

            const hashedPassword = await hashPassword(newPassword);

            await query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                  [hashedPassword, userId]);

            return { message: 'Password changed successfully' };
      }
}

export default new AuthService();