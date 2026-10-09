import express from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes/index';

dotenv.config();

const app = express();

// Middleware to parse JSON in the body
app.use(express.json());

// Global route prefix
app.use('/api/v1', apiRoutes);

export default app;