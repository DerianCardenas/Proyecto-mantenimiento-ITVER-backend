// ============================================================
// Express application configuration
// ============================================================

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import authRoutes from './modules/auth/auth.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import documentsRoutes from './modules/documents/documents.routes';
import buildingsRoutes from './modules/buildings/buildings.routes';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes (mounted under /api)
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authMiddleware, ticketsRoutes);
app.use('/api/documents', authMiddleware, documentsRoutes);
app.use('/api/buildings', buildingsRoutes);

// Error handling
app.use(errorHandler);

export default app;
