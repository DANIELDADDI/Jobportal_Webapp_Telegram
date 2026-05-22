import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getPaginationParams, formatPaginatedResponse } from '../utils/helpers.js';

export class ContactService {
      async createContactMessage(contactData) {
            const { name, email, phone, subject, message } = contactData;

            const result = await query(
                  `INSERT INTO contact_messages (name, email, phone, subject, message)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
                  [name, email, phone || null, subject, message]
            );

            return result.rows[0];
      }

      async getAllContactMessages(page = 1, limit = 10) {
            const { pageNum, limitNum, offset } = getPaginationParams(page, limit);

            const countResult = await query('SELECT COUNT(*) FROM contact_messages');
            const totalCount = parseInt(countResult.rows[0].count);

            const result = await query(
                  `SELECT * FROM contact_messages
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
                  [limitNum, offset]
            );

            return formatPaginatedResponse(result.rows, totalCount, pageNum, limitNum);
      }

      async getContactMessageById(messageId) {
            const result = await query(
                  'SELECT * FROM contact_messages WHERE id = $1',
                  [messageId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Contact message not found', 404);
            }

            return result.rows[0];
      }

      async updateMessageStatus(messageId, status) {
            const result = await query(
                  `UPDATE contact_messages 
       SET status = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
                  [status, messageId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Contact message not found', 404);
            }

            return result.rows[0];
      }

      async markAsRead(messageId) {
            return this.updateMessageStatus(messageId, 'read');
      }

      async deleteContactMessage(messageId) {
            const result = await query(
                  'DELETE FROM contact_messages WHERE id = $1 RETURNING id',
                  [messageId]
            );

            if (result.rows.length === 0) {
                  throw new AppError('Contact message not found', 404);
            }

            return { message: 'Contact message deleted successfully' };
      }
}

export default new ContactService();