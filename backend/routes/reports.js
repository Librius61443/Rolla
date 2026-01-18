/**
 * Reports API Routes
 * Handles all report-related endpoints
 */

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const User = require('../models/User');
const upload = require('../config/multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'rolla-accessibility-secret-key-2026';

/**
 * Optional auth middleware - attaches user if token present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Token invalid, continue without user
  }
  next();
};

/**
 * Helper to generate a simple user ID from request
 * In production, this would come from authentication
 */
const getUserId = (req) => {
  return req.headers['x-user-id'] || req.ip || 'anonymous';
};

/**
 * Process and optimize uploaded image
 * Fixes rotation from EXIF data (portrait photos)
 */
const processImage = async (filePath) => {
  const outputPath = filePath.replace(/\.[^.]+$/, '_processed.jpg');
  
  await sharp(filePath)
    .rotate() // Auto-rotate based on EXIF orientation
    .resize(1200, 1200, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toFile(outputPath);
  
  // Remove original file
  fs.unlinkSync(filePath);
  
  return outputPath;
};

/**
 * GET /api/reports
 * Get reports near a location
 * Query params: longitude, latitude, radius (optional, default 1000m)
 */
router.get('/', async (req, res) => {
  try {
    const { longitude, latitude, radius = 1000 } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        error: 'Missing required parameters: longitude and latitude',
      });
    }
    
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    const maxDistance = parseInt(radius);
    
    if (isNaN(lon) || isNaN(lat)) {
      return res.status(400).json({
        error: 'Invalid longitude or latitude values',
      });
    }
    
    const reports = await Report.findNearby(lon, lat, maxDistance);
    
    // Transform reports for client
    const transformedReports = reports.map(report => ({
      id: report._id,
      type: report.type,
      location: {
        longitude: report.location.coordinates[0],
        latitude: report.location.coordinates[1],
      },
      status: report.status,
      isPermanent: report.isPermanent,
      confirmationCount: report.confirmations.length,
      primaryPhoto: report.getPrimaryPhoto() ? {
        url: `${BASE_URL}${report.getPrimaryPhoto().url}`,
      } : null,
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
    }));
    
    res.json({
      reports: transformedReports,
      count: transformedReports.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

/**
 * GET /api/reports/:id
 * Get a single report by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('creatorUserId', 'username points level');
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Get creator info
    let creator = null;
    if (report.creatorUserId) {
      creator = {
        _id: report.creatorUserId._id,
        username: report.creatorUserId.username,
        points: report.creatorUserId.points,
        level: report.creatorUserId.level,
      };
    }
    
    res.json({
      id: report._id,
      _id: report._id,
      type: report.type,
      location: {
        longitude: report.location.coordinates[0],
        latitude: report.location.coordinates[1],
      },
      status: report.status,
      isPermanent: report.isPermanent,
      confirmationCount: report.confirmations.length,
      confirmations: report.confirmations.map(c => ({ userId: c.userId })),
      removalReportCount: report.removalReports.length,
      photos: report.photos
        .filter(p => !p.isHidden)
        .map(p => ({
          url: `${BASE_URL}${p.url}`,
          createdAt: p.createdAt,
        })),
      creator: creator,
      creatorId: report.creatorId,
      createdAt: report.createdAt,
      expiresAt: report.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

/**
 * POST /api/reports
 * Create a new report or confirm an existing one
 * Body: type, longitude, latitude
 * File: photo (multipart/form-data)
 */
router.post('/', optionalAuth, upload.single('photo'), async (req, res) => {
  try {
    const { type, longitude, latitude } = req.body;
    const userId = getUserId(req);
    const user = req.user; // From optional auth
    
    if (!type || !longitude || !latitude) {
      return res.status(400).json({
        error: 'Missing required fields: type, longitude, latitude',
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        error: 'Photo is required',
      });
    }
    
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    
    // Process the uploaded image
    const processedPath = await processImage(req.file.path);
    const photoUrl = `/uploads/${path.basename(processedPath)}`;
    
    // Check for existing report at the same location
    const existingReport = await Report.findDuplicate(type, lon, lat);
    
    if (existingReport) {
      // Add confirmation to existing report
      const alreadyConfirmed = existingReport.confirmations.some(
        c => c.userId === userId
      );
      
      if (!alreadyConfirmed) {
        existingReport.confirmations.push({ userId });
        
        // Award points for confirmation
        if (user) {
          await user.addPoints('CONFIRMATION_GIVEN');
        }
      }
      
      // Add photo to existing report
      existingReport.photos.push({
        url: photoUrl,
        reporterId: userId,
        reporterUserId: user?._id,
      });
      
      // Award points for adding photo
      if (user) {
        await user.addPoints('PHOTO_ADDED');
      }
      
      await existingReport.save();
      
      res.status(200).json({
        message: 'Added confirmation to existing report',
        id: existingReport._id,
        _id: existingReport._id,
        type: existingReport.type,
        location: {
          longitude: existingReport.location.coordinates[0],
          latitude: existingReport.location.coordinates[1],
        },
        confirmationCount: existingReport.confirmations.length,
        status: existingReport.status,
        isPermanent: existingReport.isPermanent,
        isNew: false,
        isConfirmation: true,
        pointsEarned: user ? 7 : 0, // CONFIRMATION_GIVEN (2) + PHOTO_ADDED (5)
      });
    } else {
      // Create new report
      const newReport = new Report({
        type,
        location: {
          type: 'Point',
          coordinates: [lon, lat],
        },
        creatorId: userId,
        creatorUserId: user?._id,
        photos: [{
          url: photoUrl,
          reporterId: userId,
          reporterUserId: user?._id,
        }],
        confirmations: [{ userId }], // Creator counts as first confirmation
      });
      
      await newReport.save();
      
      // Award points for creating report AND adding the initial photo
      let totalPointsEarned = 0;
      if (user) {
        await user.addPoints('REPORT_CREATED');
        totalPointsEarned += 1;
        
        // Also award points for the initial photo
        await user.addPoints('PHOTO_ADDED');
        totalPointsEarned += 2;
      }
      
      res.status(201).json({
        message: 'Report created successfully',
        id: newReport._id,
        _id: newReport._id,
        type: newReport.type,
        location: {
          longitude: newReport.location.coordinates[0],
          latitude: newReport.location.coordinates[1],
        },
        confirmationCount: 1,
        status: newReport.status,
        expiresAt: newReport.expiresAt,
        isNew: true,
        pointsEarned: totalPointsEarned,
      });
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * POST /api/reports/:id/add-photo
 * Add a photo to an existing report (when near the location)
 */
router.post('/:id/add-photo', optionalAuth, upload.single('photo'), async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = req.user;
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (report.status === 'removed') {
      return res.status(400).json({ error: 'This report has been removed' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Photo is required' });
    }
    
    // Process the uploaded image
    const processedPath = await processImage(req.file.path);
    const photoUrl = `/uploads/${path.basename(processedPath)}`;
    
    // Add photo to report
    report.photos.push({
      url: photoUrl,
      reporterId: userId,
      reporterUserId: user?._id,
    });
    
    // Award points for adding photo
    if (user) {
      await user.addPoints('PHOTO_ADDED');
      
      // Also award points to the original creator for receiving a photo
      if (report.creatorUserId && !report.creatorUserId.equals(user._id)) {
        const User = require('../models/User');
        const creator = await User.findById(report.creatorUserId);
        if (creator) {
          await creator.addPoints('CONFIRMATION_RECEIVED');
        }
      }
    }
    
    await report.save();
    
    res.json({
      message: 'Photo added successfully',
      photoUrl: photoUrl,
      photoCount: report.photos.length,
      pointsEarned: user ? 2 : 0, // PHOTO_ADDED points
    });
  } catch (error) {
    console.error('Error adding photo:', error);
    res.status(500).json({ error: 'Failed to add photo' });
  }
});

/**
 * POST /api/reports/:id/confirm
 * Confirm that an accessibility feature exists
 */
router.post('/:id/confirm', optionalAuth, upload.single('photo'), async (req, res) => {
  try {
    const userId = getUserId(req);
    const user = req.user; // From optional auth
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (report.status === 'removed') {
      return res.status(400).json({ error: 'This report has been removed' });
    }
    
    // Check if user already confirmed
    const alreadyConfirmed = report.confirmations.some(
      c => c.userId === userId
    );
    
    if (alreadyConfirmed) {
      return res.status(400).json({ error: 'You have already confirmed this report' });
    }
    
    // Add confirmation
    report.confirmations.push({ userId });
    
    // Award points for confirmation
    if (user) {
      await user.addPoints('CONFIRMATION_GIVEN');
      
      // Also award points to the original creator for receiving confirmation
      if (report.creatorUserId && !report.creatorUserId.equals(user._id)) {
        const User = require('../models/User');
        const creator = await User.findById(report.creatorUserId);
        if (creator) {
          await creator.addPoints('CONFIRMATION_RECEIVED');
        }
      }
    }
    
    // If photo provided, add it
    if (req.file) {
      const processedPath = await processImage(req.file.path);
      const photoUrl = `/uploads/${path.basename(processedPath)}`;
      report.photos.push({
        url: photoUrl,
        reporterId: userId,
        reporterUserId: user?._id,
      });
      
      // Award points for adding photo
      if (user) {
        await user.addPoints('PHOTO_ADDED');
      }
    }
    
    await report.save();
    
    res.json({
      message: 'Confirmation added',
      confirmationCount: report.confirmations.length,
      status: report.status,
      isPermanent: report.isPermanent,
      pointsEarned: user ? (req.file ? 4 : 2) : 0, // CONFIRMATION_GIVEN + optional PHOTO_ADDED
    });
  } catch (error) {
    console.error('Error confirming report:', error);
    res.status(500).json({ error: 'Failed to confirm report' });
  }
});

/**
 * POST /api/reports/:id/remove
 * Report that an accessibility feature has been removed/doesn't exist
 */
router.post('/:id/remove', async (req, res) => {
  try {
    const userId = getUserId(req);
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    if (report.status === 'removed') {
      return res.status(400).json({ error: 'This report has already been removed' });
    }
    
    // Check if user already reported removal
    const alreadyReported = report.removalReports.some(
      r => r.userId === userId
    );
    
    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this as removed' });
    }
    
    // Add removal report
    report.removalReports.push({ userId });
    
    await report.save();
    
    res.json({
      message: 'Removal report added',
      removalReportCount: report.removalReports.length,
      status: report.status,
    });
  } catch (error) {
    console.error('Error reporting removal:', error);
    res.status(500).json({ error: 'Failed to report removal' });
  }
});

/**
 * POST /api/reports/:id/report-photo
 * Report a photo as inappropriate/incorrect
 */
router.post('/:id/report-photo', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { photoIndex, reason } = req.body;
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const photo = report.photos[photoIndex];
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Check if user already reported this photo
    const alreadyReported = photo.badPhotoReports.some(
      r => r.reporterId === userId
    );
    
    if (alreadyReported) {
      return res.status(400).json({ error: 'You have already reported this photo' });
    }
    
    // Add bad photo report
    photo.badPhotoReports.push({
      reporterId: userId,
      reason: reason || 'Inappropriate or incorrect photo',
    });
    
    // Hide photo if it has 5+ reports
    if (photo.badPhotoReports.length >= 5) {
      photo.isHidden = true;
    }
    
    await report.save();
    
    res.json({
      message: 'Photo report added',
      reportCount: photo.badPhotoReports.length,
      isHidden: photo.isHidden,
    });
  } catch (error) {
    console.error('Error reporting photo:', error);
    res.status(500).json({ error: 'Failed to report photo' });
  }
});

module.exports = router;
