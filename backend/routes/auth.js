/**
 * Authentication Routes
 * Handles user registration, login, and profile
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'rolla-accessibility-secret-key-2026';
const JWT_EXPIRES_IN = '30d';

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Middleware to verify JWT token
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Optional auth middleware - sets user if token present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
        req.userId = user._id;
      }
    }
    next();
  } catch (error) {
    // Token invalid, continue without user
    next();
  }
};

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });
    
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Create user
    const user = new User({
      username,
      email: email.toLowerCase(),
      password,
    });
    
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Update last active
    user.lastActive = new Date();
    await user.save();
    
    // Generate token
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      user: req.user.getPublicProfile(),
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * GET /api/auth/leaderboard
 * Get points leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await User.getLeaderboard(limit);
    
    res.json({
      leaderboard: leaderboard.map(user => ({
        username: user.username,
        points: user.points,
        level: user.level,
        totalReports: user.stats.totalReports,
      })),
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

/**
 * GET /api/auth/user/:userId
 * Get user public profile by ID
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: user.getPublicProfile(),
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

/**
 * POST /auth/claim-reports
 * Claim reports created with this device ID and link them to the user's account
 */
router.post('/claim-reports', authMiddleware, async (req, res) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user._id;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID required' });
    }
    
    // Import Report model
    const Report = require('../models/Report');
    
    // Find all reports created by this device that don't have a creatorUserId
    const unclaimedReports = await Report.find({
      creatorId: deviceId,
      $or: [
        { creatorUserId: null },
        { creatorUserId: { $exists: false } }
      ]
    });
    
    if (unclaimedReports.length === 0) {
      return res.json({
        message: 'No unclaimed reports found for this device',
        claimedCount: 0,
        user: req.user.getPublicProfile()
      });
    }
    
    // Update all unclaimed reports to link to this user
    const result = await Report.updateMany(
      {
        creatorId: deviceId,
        $or: [
          { creatorUserId: null },
          { creatorUserId: { $exists: false } }
        ]
      },
      {
        $set: { creatorUserId: userId }
      }
    );
    
    // Update user's totalReports stat
    await User.findByIdAndUpdate(userId, {
      $inc: { 'stats.totalReports': result.modifiedCount }
    });
    
    // Refresh user data
    const updatedUser = await User.findById(userId);
    
    res.json({
      message: `Successfully claimed ${result.modifiedCount} reports!`,
      claimedCount: result.modifiedCount,
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Claim reports error:', error);
    res.status(500).json({ error: 'Failed to claim reports' });
  }
});

// Export middleware for use in other routes
router.authMiddleware = authMiddleware;
router.optionalAuth = optionalAuth;

module.exports = router;
