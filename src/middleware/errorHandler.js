// Custom Error Class
export class AppError extends Error {
      constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
            Error.captureStackTrace(this, this.constructor);
      }
}





// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
      err.statusCode = err.statusCode || 500;
      err.message = err.message || 'Internal Server Error';

      // Duplicate Key Error (PostgreSQL)
      if (err.code === '23505') {
            const message = `Duplicate field value: ${err.detail}`;
            err = new AppError(message, 400);
      }

      // Invalid JWT Token
      if (err.name === 'JsonWebTokenError') {
            const message = 'Invalid token';
            err = new AppError(message, 401);
      }

      // Expired JWT Token
      if (err.name === 'TokenExpiredError') {
            const message = 'Token has expired';
            err = new AppError(message, 401);
      }

      res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
};




// Async Wrapper to catch errors in controllers
export const asyncHandler = (fn) => (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
};




// 404 Not Found Handler
export const notFoundHandler = (req, res) => {
      res.status(404).json({
            success: false,
            message: 'Route not found'
      });
};