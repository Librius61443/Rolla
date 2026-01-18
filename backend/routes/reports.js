/**
 * Reports API Routes
 * Handles all report-related endpoints
 */

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const upload = require('../config/multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

/**
 * Helper to generate a simple user ID from request
 * In production, this would come from authentication
 */
const getUserId = (req) => {
  return req.headers['x-user-id'] || req.ip || 'anonymous';
};

/**
 * Process and optimize uploaded image
 */
const processImage = async (filePath) => {
  const outputPath = filePath.replace(/\.[^.]+$/, '_processed.jpg');
  
  await sharp(filePath)
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
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json({
      id: report._id,
      type: report.type,
      location: {
        longitude: report.location.coordinates[0],
        latitude: report.location.coordinates[1],
      },
      status: report.status,
      isPermanent: report.isPermanent,
      confirmationCount: report.confirmations.length,
      removalReportCount: report.removalReports.length,
      photos: report.photos
        .filter(p => !p.isHidden)
        .map(p => ({
          url: `${BASE_URL}${p.url}`,
          createdAt: p.createdAt,
        })),
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
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { type, longitude, latitude } = req.body;
    const userId = getUserId(req);
    
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
      }
      
      // Add photo to existing report
      existingReport.photos.push({
        url: photoUrl,
        reporterId: userId,
      });
      
      await existingReport.save();
      
      res.status(200).json({
        message: 'Added confirmation to existing report',
        id: existingReport._id,
        type: existingReport.type,
        confirmationCount: existingReport.confirmations.length,
        status: existingReport.status,
        isPermanent: existingReport.isPermanent,
        isNew: false,
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
        photos: [{
          url: photoUrl,
          reporterId: userId,
        }],
        confirmations: [{ userId }], // Creator counts as first confirmation
      });
      
      await newReport.save();
      
      res.status(201).json({
        message: 'Report created successfully',
        id: newReport._id,
        type: newReport.type,
        confirmationCount: 1,
        status: newReport.status,
        expiresAt: newReport.expiresAt,
        isNew: true,
      });
    }
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

/**
 * POST /api/reports/:id/confirm
 * Confirm that an accessibility feature exists
 */
router.post('/:id/confirm', upload.single('photo'), async (req, res) => {
  try {
    const userId = getUserId(req);
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
    
    // If photo provided, add it
    if (req.file) {
      const processedPath = await processImage(req.file.path);
      const photoUrl = `/uploads/${path.basename(processedPath)}`;
      report.photos.push({
        url: photoUrl,
        reporterId: userId,
      });
    }
    
    await report.save();
    
    res.json({
      message: 'Confirmation added',
      confirmationCount: report.confirmations.length,
      status: report.status,
      isPermanent: report.isPermanent,
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
