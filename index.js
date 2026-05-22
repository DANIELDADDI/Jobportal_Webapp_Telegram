import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './src/routes/authRoutes.js';
import jobRoutes from './src/routes/jobRoutes.js';
import applicationRoutes from './src/routes/applicationRoutes.js';
import contactRoutes from './src/routes/contactRoutes.js';

// Import middleware
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));




// Health check route
app.get('/health', (req, res) => {
      res.status(200).json({
            success: true,
            message: 'Server is running',
            timestamp: new Date().toISOString()
      });
});



// API Routes
// app.use('/api/v1/auth', authRoutes);
// app.use('/api/v1/jobs', jobRoutes);
// app.use('/api/v1/applications', applicationRoutes);
// app.use('/api/v1/contact', contactRoutes);



// 404 Not Found
// app.use(notFoundHandler);

// Error Handling Middleware
// app.use(errorHandler);




// Start server
app.listen(PORT, () => {
      console.log(`🚀 Server running on port http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;