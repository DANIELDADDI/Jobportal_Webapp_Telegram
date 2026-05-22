import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';




// Password Hashing
export const hashPassword = async (password) => {
      const salt = await bcrypt.genSalt(10);
      return bcrypt.hash(password, salt);
};

export const comparePassword = (password, hashedPassword) => {
      return bcrypt.compare(password, hashedPassword);
};




// JWT Token Generation
export const generateToken = (userId, userType) => {
      const token = jwt.sign(
            { id: userId, user_type: userType },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );
      return token;
};






// Response Formatting
export const successResponse = (res, statusCode, message, data = null) => {
      return res.status(statusCode).json({
            success: true,
            message,
            ...(data && { data })
      });
};

export const errorResponse = (res, statusCode, message) => {
      return res.status(statusCode).json({
            success: false,
            message
      });
};





// Pagination Helper
export const getPaginationParams = (page = 1, limit = 10) => {
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(parseInt(limit) || 10, process.env.MAX_PAGE_LIMIT || 100);
      const offset = (pageNum - 1) * limitNum;
      return { pageNum, limitNum, offset };
};




export const formatPaginatedResponse = (data, totalCount, page, limit) => {
      return {
            data,
            pagination: {
                  total: totalCount,
                  page: parseInt(page),
                  limit: parseInt(limit),
                  pages: Math.ceil(totalCount / limit)
            }
      };
};