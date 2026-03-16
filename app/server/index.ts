import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGODB_URI as string)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

import notesRoutes from './routes/notesRoutes';
import publicRoutes from './routes/publicRoutes';

// Routes
app.use('/api/notes', notesRoutes);
app.use('/api/public/brain', publicRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Second Brain API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
