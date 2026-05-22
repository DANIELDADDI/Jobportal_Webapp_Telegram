import contactService from '../services/contactService.js';
import { successResponse } from '../utils/helpers.js';

export class ContactController {
      async createContactMessage(req, res, next) {
            try {
                  const message = await contactService.createContactMessage(req.body);
                  return successResponse(res, 201, 'Message sent successfully', message);
            } catch (error) {
                  next(error);
            }
      }

      async getAllContactMessages(req, res, next) {
            try {
                  const { page = 1, limit = 10 } = req.query;
                  const result = await contactService.getAllContactMessages(page, limit);
                  return successResponse(res, 200, 'Contact messages retrieved successfully', result);
            } catch (error) {
                  next(error);
            }
      }

      async getContactMessage(req, res, next) {
            try {
                  const message = await contactService.getContactMessageById(req.params.id);
                  return successResponse(res, 200, 'Contact message retrieved successfully', message);
            } catch (error) {
                  next(error);
            }
      }

      async markAsRead(req, res, next) {
            try {
                  const message = await contactService.markAsRead(req.params.id);
                  return successResponse(res, 200, 'Message marked as read', message);
            } catch (error) {
                  next(error);
            }
      }

      async deleteContactMessage(req, res, next) {
            try {
                  const result = await contactService.deleteContactMessage(req.params.id);
                  return successResponse(res, 200, result.message);
            } catch (error) {
                  next(error);
            }
      }
}

export default new ContactController();