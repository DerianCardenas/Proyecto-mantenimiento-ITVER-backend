// ============================================================
// Express application configuration
// ============================================================

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware, requirePasswordChanged } from './middleware/authMiddleware';
import { dbContext } from './middleware/dbContext';
import authRoutes from './modules/auth/auth.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import techniciansRoutes from './modules/technicians/technicians.routes';
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
// dbContext establishes RLS session variables for each request
app.use('/api/auth', authRoutes);
app.use('/api/tickets', authMiddleware, requirePasswordChanged, dbContext, ticketsRoutes);
app.use('/api/technicians', authMiddleware, requirePasswordChanged, dbContext, techniciansRoutes);
app.use('/api/documents', authMiddleware, requirePasswordChanged, dbContext, documentsRoutes);
app.use('/api/buildings', authMiddleware, requirePasswordChanged, dbContext, buildingsRoutes);

// Error handling
app.use(errorHandler);

export default app;
