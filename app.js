const express = require('express');
const mongoose = require('mongoose');
const engine = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local');
require('dotenv').config();

// Models
const User = require('./models/User');
const Batch = require('./models/Batch');
const Student = require('./models/Student');

// Routes
const authRoutes = require('./routes/authRoutes');
const batchRoutes = require('./routes/batchRoutes');
const studentRoutes = require('./routes/studentRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

// Auth Middleware
const { isLoggedIn } = require('./middleware/auth');

const app = express();

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/coaching_db')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ DB Error:', err));

// EJS-Mate Setup
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'coaching_super_secret_key_123',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 Days
  }
}));

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Global variable for Navbar
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Public Routes
app.use('/', authRoutes);

// Protected Home Dashboard
app.get('/', isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalBatches = await Batch.countDocuments({ owner: userId });
    const totalStudents = await Student.countDocuments({ owner: userId });
    const pendingFeesCount = await Student.countDocuments({ owner: userId, feesStatus: 'Pending' });
    const paidFeesCount = await Student.countDocuments({ owner: userId, feesStatus: 'Paid' });

    const recentStudents = await Student.find({ owner: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('batch');

    res.render('home', {
      title: 'Dashboard - Coaching App',
      stats: {
        totalBatches,
        totalStudents,
        pendingFeesCount,
        paidFeesCount
      },
      recentStudents
    });
  } catch (err) {
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

// Protected Resource Routes
app.use('/batches', isLoggedIn, batchRoutes);
app.use('/students', isLoggedIn, studentRoutes);
app.use('/attendance', isLoggedIn, attendanceRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong on the server!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});