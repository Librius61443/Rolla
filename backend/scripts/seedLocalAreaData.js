/**
 * Seed Local Area Data Script
 * Generates realistic accessibility reports around a specified location
 * No external API required!
 * 
 * Usage: node seedLocalAreaData.js [latitude] [longitude] [radius_km] [count]
 * Example: node seedLocalAreaData.js 43.777118 -79.502237 2 50
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Parse command line arguments or use defaults
const CENTER_LAT = parseFloat(process.argv[2]) || 43.777118;
const CENTER_LNG = parseFloat(process.argv[3]) || -79.502237;
const RADIUS_KM = parseFloat(process.argv[4]) || 2;
const REPORT_COUNT = parseInt(process.argv[5]) || 50;

// All accessibility types
const ACCESSIBILITY_TYPES = [
  'elevator',
  'ramp',
  'accessible_restroom',
  'wheelchair_entrance',
  'accessible_parking',
  'tactile_paving',
  'audio_signals',
  'braille_signage',
  'automatic_doors',
];

// Place names to make reports more realistic
const PLACE_PREFIXES = [
  'Main Street', 'Central', 'North', 'South', 'East', 'West',
  'Downtown', 'Uptown', 'Parkside', 'Riverside', 'Lakeside',
  'Highland', 'Midtown', 'Westside', 'Eastside', 'Village',
];

const PLACE_TYPES = [
  'Mall', 'Station', 'Library', 'Community Centre', 'Hospital',
  'Medical Centre', 'Shopping Plaza', 'Transit Hub', 'Office Building',
  'Recreation Centre', 'Grocery Store', 'Bank', 'Post Office',
  'Government Building', 'University', 'College', 'High School',
  'Church', 'Mosque', 'Temple', 'Museum', 'Art Gallery',
  'Theatre', 'Cinema', 'Restaurant', 'Cafe', 'Pharmacy',
  'Hotel', 'Apartment Complex', 'Condo Tower', 'Park Entrance',
];

// Generate a random point within radius of center
function randomPointInRadius(centerLat, centerLng, radiusKm) {
  // Convert radius from km to degrees (approximate)
  const radiusLat = radiusKm / 111.32;
  const radiusLng = radiusKm / (111.32 * Math.cos(centerLat * Math.PI / 180));
  
  // Random angle and distance
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.sqrt(Math.random()) * radiusKm; // sqrt for uniform distribution
  
  const offsetLat = (distance / 111.32) * Math.cos(angle);
  const offsetLng = (distance / (111.32 * Math.cos(centerLat * Math.PI / 180))) * Math.sin(angle);
  
  return {
    lat: centerLat + offsetLat,
    lng: centerLng + offsetLng,
  };
}

// Generate a realistic place name
function generatePlaceName() {
  const prefix = PLACE_PREFIXES[Math.floor(Math.random() * PLACE_PREFIXES.length)];
  const type = PLACE_TYPES[Math.floor(Math.random() * PLACE_TYPES.length)];
  return `${prefix} ${type}`;
}

// Get description for accessibility type
function getDescription(type, placeName) {
  const descriptions = {
    elevator: `Elevator access at ${placeName}`,
    ramp: `Wheelchair ramp at ${placeName}`,
    accessible_restroom: `Accessible restroom at ${placeName}`,
    wheelchair_entrance: `Wheelchair accessible entrance at ${placeName}`,
    accessible_parking: `Accessible parking at ${placeName}`,
    tactile_paving: `Tactile paving near ${placeName}`,
    audio_signals: `Audio signals at ${placeName}`,
    braille_signage: `Braille signage at ${placeName}`,
    automatic_doors: `Automatic doors at ${placeName}`,
  };
  return descriptions[type] || `Accessibility feature at ${placeName}`;
}

async function seedLocalAreaData() {
  console.log('🌍 Starting local area data seed...\n');
  console.log(`📍 Center: (${CENTER_LAT}, ${CENTER_LNG})`);
  console.log(`📏 Radius: ${RADIUS_KM}km`);
  console.log(`📊 Reports to create: ${REPORT_COUNT}\n`);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing seeded data
    const seederId = 'local-area-seed';
    const existingCount = await Report.countDocuments({ creatorId: seederId });
    if (existingCount > 0) {
      console.log(`🗑️  Removing ${existingCount} existing seeded reports...`);
      await Report.deleteMany({ creatorId: seederId });
    }

    console.log(`\n🏗️  Creating ${REPORT_COUNT} accessibility reports...\n`);
    
    let created = 0;
    const typeCount = {};
    
    for (let i = 0; i < REPORT_COUNT; i++) {
      // Generate random location
      const { lat, lng } = randomPointInRadius(CENTER_LAT, CENTER_LNG, RADIUS_KM);
      
      // Pick random accessibility type
      const type = ACCESSIBILITY_TYPES[Math.floor(Math.random() * ACCESSIBILITY_TYPES.length)];
      typeCount[type] = (typeCount[type] || 0) + 1;
      
      // Generate place name and description
      const placeName = generatePlaceName();
      const description = getDescription(type, placeName);
      
      // Generate random confirmations (0-20)
      const numConfirmations = Math.floor(Math.random() * 21);
      const confirmations = Array.from({ length: numConfirmations }, (_, j) => ({
        userId: `seed-confirmer-${j}-${i}`,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      }));
      
      // Determine status based on confirmations
      let status = 'pending';
      let isPermanent = false;
      if (numConfirmations >= 25) {
        status = 'permanent';
        isPermanent = true;
      } else if (numConfirmations >= 5) {
        status = 'confirmed';
      }
      
      // Create the report
      const report = new Report({
        type: type,
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        creatorId: seederId,
        confirmations: confirmations,
        status: status,
        isPermanent: isPermanent,
        expiresAt: isPermanent ? null : new Date(Date.now() + (48 + numConfirmations * 12) * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        metadata: {
          source: 'local-seed',
          placeName: placeName,
          name: description,
        },
      });
      
      await report.save();
      created++;
      
      // Progress indicator
      if (created % 10 === 0) {
        process.stdout.write(`   Created ${created}/${REPORT_COUNT} reports...\r`);
      }
    }

    console.log(`\n\n✅ Successfully created ${created} accessibility reports!\n`);
    
    // Show summary by type
    console.log('📊 Reports by accessibility type:');
    Object.entries(typeCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });

    // Show total counts
    const totalReports = await Report.countDocuments();
    console.log(`\n📈 Total reports in database: ${totalReports}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seed
seedLocalAreaData();
