require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./backend/config/db');
const authRoutes = require('./backend/routes/authRoutes');
const memoryRoutes = require('./backend/routes/memoryRoutes');
const userRoutes = require('./backend/routes/userRoutes');
const { authenticateToken } = require('./backend/middleware/authMiddleware');
const { serveMedia } = require('./backend/controllers/memoryController');
const { notFound, errorHandler } = require('./backend/middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, 'uploads');
const frontendDir = path.join(__dirname, 'frontend');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

connectDB();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));

app.use(express.static(frontendDir));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'memory-galaxy',
    tagline: 'Every memory becomes a star.',
    time: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/user', userRoutes);
app.get('/api/media/:filename', authenticateToken, serveMedia);

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Memory Galaxy orbiting at http://localhost:${PORT}`);
});
