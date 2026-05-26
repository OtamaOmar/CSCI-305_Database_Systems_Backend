require('dotenv').config();
const validateEnv = require('./middleware/validateEnv');

// Validate environment variables before starting
try {
  validateEnv();
} catch (err) {
  console.error('Configuration Error:', err.message);
  process.exit(1);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const { testConnection } = require('./db/connection');

const app = express();

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// CORS - restrict to specific origins in production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Request logging
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
});

app.use(express.json());

// Health check endpoint (before auth routes)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/patients',          require('./routes/patients'));
app.use('/api/notifications',     require('./routes/notifications'));
app.use('/api/doctors',           require('./routes/doctors'));
app.use('/api/cases',             require('./routes/cases'));
app.use('/api/appointments',      require('./routes/appointments'));
app.use('/api/prescriptions',     require('./routes/prescriptions'));
app.use('/api/departments',       require('./routes/departments'));
app.use('/api/locations',         require('./routes/locations'));
app.use('/api/medical-files',     require('./routes/medical-files'));
app.use('/api/hospital-files',    require('./routes/hospital-files'));
app.use('/api/rooms',             require('./routes/rooms'));
app.use('/api/room-reservations', require('./routes/room-reservations'));
app.use('/api/users',             require('./routes/users'));
app.use('/api/roles',             require('./routes/roles'));
app.use('/api/invitations',       require('./routes/invitations'));
app.use('/api/contact',           require('./routes/contact'));
app.use('/api/dashboard',         require('./routes/dashboard'));
app.use('/api/reports',           require('./routes/reports'));
app.use('/api/staff-schedule',    require('./routes/staff-schedule'));
app.use('/api/ambulances',        require('./routes/ambulances'));
app.use('/api/triage',            require('./routes/triage'));

app.get('/', (req, res) => {
  res.json({ message: 'PulseED Backend API is running.' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

// Global error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connection retry logic
async function startServer(retries = 3) {
  try {
    await testConnection();
    console.log('Database connected successfully.');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error(`Database connection failed (${retries} retries left):`, err.message);
    
    if (retries > 0) {
      console.log('Retrying in 5 seconds...');
      setTimeout(() => startServer(retries - 1), 5000);
    } else {
      console.error('Failed to connect to database after 3 attempts. Exiting.');
      process.exit(1);
    }
  }
}

startServer();
