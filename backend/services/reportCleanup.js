/**
 * Report Cleanup Service
 * Handles automatic cleanup of expired reports
 */

const Report = require('../models/Report');

/**
 * Clean up expired reports
 * Note: MongoDB TTL index handles most expiry, but this is for additional cleanup
 */
const cleanupExpiredReports = async () => {
  try {
    const now = new Date();
    
    // Find and remove reports that have expired and are not permanent
    const result = await Report.deleteMany({
      isPermanent: false,
      expiresAt: { $lt: now },
      status: { $ne: 'removed' },
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired reports`);
    }
    
    // Also clean up reports marked as removed
    const removedResult = await Report.deleteMany({
      status: 'removed',
      updatedAt: { $lt: new Date(now - 7 * 24 * 60 * 60 * 1000) }, // 7 days after removal
    });
    
    if (removedResult.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${removedResult.deletedCount} removed reports`);
    }
  } catch (error) {
    console.error('Error during report cleanup:', error);
  }
};

/**
 * Start the cleanup job - runs every hour
 */
const startCleanupJob = () => {
  // Run immediately on startup
  cleanupExpiredReports();
  
  // Then run every hour
  setInterval(cleanupExpiredReports, 60 * 60 * 1000);
  
  console.log('📅 Report cleanup job started');
};

module.exports = {
  cleanupExpiredReports,
  startCleanupJob,
};
