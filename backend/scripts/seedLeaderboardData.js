/**
 * Seed Leaderboard Data Script
 * Creates fake users for leaderboard testing
 * Updates a specified user to be #1 on the leaderboard
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Fake users with various point totals
const FAKE_USERS = [
  {
    username: 'AccessChamp',
    email: 'accesschamp@demo.com',
    points: 847,
    stats: { totalReports: 89, totalConfirmations: 156, totalPhotos: 45 },
    pointsBreakdown: { reportsCreated: 89, confirmationsGiven: 156, confirmationsReceived: 512, photosAdded: 90 },
  },
  {
    username: 'WheelieGood',
    email: 'wheeliegood@demo.com',
    points: 723,
    stats: { totalReports: 67, totalConfirmations: 134, totalPhotos: 38 },
    pointsBreakdown: { reportsCreated: 67, confirmationsGiven: 134, confirmationsReceived: 450, photosAdded: 72 },
  },
  {
    username: 'RampRanger',
    email: 'rampranger@demo.com',
    points: 651,
    stats: { totalReports: 58, totalConfirmations: 112, totalPhotos: 31 },
    pointsBreakdown: { reportsCreated: 58, confirmationsGiven: 112, confirmationsReceived: 420, photosAdded: 61 },
  },
  {
    username: 'PathFinder22',
    email: 'pathfinder22@demo.com',
    points: 589,
    stats: { totalReports: 52, totalConfirmations: 98, totalPhotos: 27 },
    pointsBreakdown: { reportsCreated: 52, confirmationsGiven: 98, confirmationsReceived: 380, photosAdded: 59 },
  },
  {
    username: 'CityScout',
    email: 'cityscout@demo.com',
    points: 534,
    stats: { totalReports: 45, totalConfirmations: 89, totalPhotos: 24 },
    pointsBreakdown: { reportsCreated: 45, confirmationsGiven: 89, confirmationsReceived: 350, photosAdded: 50 },
  },
  {
    username: 'UrbanHelper',
    email: 'urbanhelper@demo.com',
    points: 478,
    stats: { totalReports: 41, totalConfirmations: 76, totalPhotos: 21 },
    pointsBreakdown: { reportsCreated: 41, confirmationsGiven: 76, confirmationsReceived: 310, photosAdded: 51 },
  },
  {
    username: 'MapMaster99',
    email: 'mapmaster99@demo.com',
    points: 423,
    stats: { totalReports: 36, totalConfirmations: 68, totalPhotos: 18 },
    pointsBreakdown: { reportsCreated: 36, confirmationsGiven: 68, confirmationsReceived: 280, photosAdded: 39 },
  },
  {
    username: 'AccessAngel',
    email: 'accessangel@demo.com',
    points: 367,
    stats: { totalReports: 31, totalConfirmations: 59, totalPhotos: 15 },
    pointsBreakdown: { reportsCreated: 31, confirmationsGiven: 59, confirmationsReceived: 240, photosAdded: 37 },
  },
  {
    username: 'RollaRookie',
    email: 'rollarookie@demo.com',
    points: 312,
    stats: { totalReports: 26, totalConfirmations: 51, totalPhotos: 13 },
    pointsBreakdown: { reportsCreated: 26, confirmationsGiven: 51, confirmationsReceived: 200, photosAdded: 35 },
  },
  {
    username: 'ElevatorPro',
    email: 'elevatorpro@demo.com',
    points: 256,
    stats: { totalReports: 22, totalConfirmations: 43, totalPhotos: 11 },
    pointsBreakdown: { reportsCreated: 22, confirmationsGiven: 43, confirmationsReceived: 160, photosAdded: 31 },
  },
  {
    username: 'NewExplorer',
    email: 'newexplorer@demo.com',
    points: 89,
    stats: { totalReports: 8, totalConfirmations: 15, totalPhotos: 4 },
    pointsBreakdown: { reportsCreated: 8, confirmationsGiven: 15, confirmationsReceived: 50, photosAdded: 16 },
  },
  {
    username: 'JustStarted',
    email: 'juststarted@demo.com',
    points: 34,
    stats: { totalReports: 3, totalConfirmations: 6, totalPhotos: 1 },
    pointsBreakdown: { reportsCreated: 3, confirmationsGiven: 6, confirmationsReceived: 20, photosAdded: 5 },
  },
];

// User to update to #1 (change this to your username or email)
const TOP_USER_EMAIL = process.argv[2] || null;
const TOP_USER_POINTS = 1250; // More points than the highest fake user

async function seedLeaderboard() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Hash a common password for fake users
    const hashedPassword = await bcrypt.hash('demo123456', 10);

    // Delete existing fake users (by email domain)
    const deleteResult = await User.deleteMany({ email: /@demo\.com$/ });
    console.log(`Deleted ${deleteResult.deletedCount} existing demo users`);

    // Create fake users
    for (const userData of FAKE_USERS) {
      const user = new User({
        ...userData,
        password: hashedPassword,
        level: getLevel(userData.points),
      });
      await user.save();
      console.log(`Created user: ${userData.username} (${userData.points} pts)`);
    }

    console.log(`\n✅ Created ${FAKE_USERS.length} fake users for leaderboard`);

    // Update specified user to be #1
    if (TOP_USER_EMAIL) {
      const topUser = await User.findOne({ 
        $or: [
          { email: TOP_USER_EMAIL.toLowerCase() },
          { username: TOP_USER_EMAIL }
        ]
      });
      
      if (topUser) {
        topUser.points = TOP_USER_POINTS;
        topUser.stats = { totalReports: 112, totalConfirmations: 245, totalPhotos: 67 };
        topUser.pointsBreakdown = {
          reportsCreated: 112,
          confirmationsGiven: 245,
          confirmationsReceived: 780,
          photosAdded: 113,
        };
        topUser.level = getLevel(TOP_USER_POINTS);
        await topUser.save();
        console.log(`\n🏆 Updated ${topUser.username} to #1 with ${TOP_USER_POINTS} points!`);
      } else {
        console.log(`\n⚠️ User not found: ${TOP_USER_EMAIL}`);
        console.log('Available users:');
        const users = await User.find({}, 'username email').limit(10);
        users.forEach(u => console.log(`  - ${u.username} (${u.email})`));
      }
    } else {
      // Show existing users
      console.log('\nTo make yourself #1, run:');
      console.log('  node scripts/seedLeaderboardData.js YOUR_EMAIL_OR_USERNAME\n');
      
      const users = await User.find({ email: { $not: /@demo\.com$/ } }, 'username email points').limit(10);
      if (users.length > 0) {
        console.log('Your existing users:');
        users.forEach(u => console.log(`  - ${u.username} (${u.email}) - ${u.points} pts`));
      }
    }

    // Show leaderboard
    console.log('\n📊 Current Leaderboard (Top 10):');
    const leaderboard = await User.find({}, 'username points level')
      .sort({ points: -1 })
      .limit(10);
    
    leaderboard.forEach((user, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`${medal} ${i + 1}. ${user.username} - ${user.points} pts (${user.level})`);
    });

  } catch (error) {
    console.error('Error seeding leaderboard:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

function getLevel(points) {
  if (points >= 1000) return 'Legend';
  if (points >= 500) return 'Champion';
  if (points >= 250) return 'Expert';
  if (points >= 100) return 'Contributor';
  if (points >= 25) return 'Explorer';
  return 'Newcomer';
}

seedLeaderboard();
