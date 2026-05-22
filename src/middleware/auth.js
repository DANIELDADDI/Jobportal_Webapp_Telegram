import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
      try {
            const token = req.headers.authorization?.split(' ')[1];

            if (!token) {
                  return res.status(401).json({
                        success: false,
                        message: 'No token provided'
                  });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
      } catch (error) {
            return res.status(401).json({
                  success: false,
                  message: 'Invalid or expired token'
            });
      }
};

export const optionalAuthMiddleware = (req, res, next) => {
      try {
            const token = req.headers.authorization?.split(' ')[1];

            if (token) {
                  const decoded = jwt.verify(token, process.env.JWT_SECRET);
                  req.user = decoded;
            }
            next();
      } catch (error) {
            next();
      }
};

export const requireRole = (...roles) => {
      return (req, res, next) => {
            if (!req.user) {
                  return res.status(401).json({
                        success: false,
                        message: 'Authentication required'
                  });
            }

            if (!roles.includes(req.user.user_type)) {
                  return res.status(403).json({
                        success: false,
                        message: 'You do not have permission to access this resource'
                  });
            }

            next();
      };
};