import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { healthRouter } from './routes/health';
import { userRouter } from './routes/users';
import { taskRouter } from './routes/tasks';
import { eventRouter } from './routes/events';
import { moodRouter } from './routes/mood';
import { habitRouter } from './routes/habits';
import { chatRouter } from './routes/chat';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = process.env.PORT || 3000;

// Security & parsing middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/health', healthRouter);
app.use('/api/users', userRouter);
app.use('/api/tasks', taskRouter);
app.use('/api/events', eventRouter);
app.use('/api/mood', moodRouter);
app.use('/api/habits', habitRouter);
app.use('/api/chat', chatRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(port, () => {
  console.log(`LifeFlow API running on port ${port}`);
});

export default app;
