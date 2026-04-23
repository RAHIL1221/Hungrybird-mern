require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: [process.env.CLIENT_URL, process.env.CUSTOMER_URL || 'http://localhost:3001'], credentials: true },
});

app.set('io', io);

// Connect DB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: [process.env.CLIENT_URL, process.env.CUSTOMER_URL || 'http://localhost:3001'], credentials: true }));
app.use(mongoSanitize());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static - MUST be before other middleware
const path = require('path');
app.use('/uploads', cors(), express.static(path.join(__dirname, 'uploads')));
console.log('📁 Static files served from:', path.join(__dirname, 'uploads'));

if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Rate limiting - only in production or with higher limits in development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX || 1000), // Increased default to 1000
  message: { success: false, message: 'Too many requests, please try again later' },
  skip: (req) => process.env.NODE_ENV === 'development', // Skip rate limiting in development
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customer/auth', require('./routes/customerAuth'));
app.use('/api/customer/menu', require('./routes/customerMenu'));
app.use('/api/customer/orders', require('./routes/customerOrders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/food', require('./routes/food'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admins', require('./routes/admins'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Test endpoint to check uploads
app.get('/api/test-image', (req, res) => {
  res.json({ 
    message: 'Test image URL', 
    testUrl: 'http://localhost:5000/uploads/1776756508401-safari top.jpg',
    note: 'Try accessing this URL directly in browser'
  });
});

// Socket.io
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join:admin', () => socket.join('admin-room'));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));

module.exports = { app, io };
