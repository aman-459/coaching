const express = require('express');
const router = express.Router();
const User = require('../models/User');
const passport = require('passport');

// GET /signup
router.get('/signup', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/signup', { title: 'Register - Coaching App' });
});

// POST /signup
router.post('/signup', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, err => {
      if (err) return next(err);
      res.redirect('/');
    });
  } catch (e) {
    res.status(400).send('Registration Error: ' + e.message);
  }
});

// GET /login
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/login', { title: 'Login - Coaching App' });
});

// POST /login
router.post('/login', passport.authenticate('local', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});

// GET /logout
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

module.exports = router;