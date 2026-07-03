import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Import Routes
import roomRoutes from './routes/room.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import opayRoutes from './routes/opay.routes';
import settingsRoutes from './routes/settings.routes';
import authRoutes from './routes/auth.routes';
import reviewsRoutes from './routes/reviews.routes';
import galleryRoutes from './routes/gallery.routes';
import uploadRoutes from './routes/upload.routes';
import communicationsRoutes from './routes/communications.routes';

// Import Scheduler
import { startEmailScheduler } from './scheduler';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Test routes
app.get('/', (req: Request, res: Response) => {
  res.send('API is running');
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Mount routes
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/opay', opayRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/communications', communicationsRoutes);

// Start scheduler
startEmailScheduler();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});