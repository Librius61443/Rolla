/**
 * Seed Demo Data Script
 * Creates sample accessibility reports for testing
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Mississauga demo locations with realistic accessibility features
const DEMO_REPORTS = [
  // Square One Shopping Centre area
  {
    type: 'elevator',
    longitude: -79.6426,
    latitude: 43.5933,
    description: 'Elevator at Square One main entrance',
  },
  {
    type: 'ramp',
    longitude: -79.6420,
    latitude: 43.5930,
    description: 'Wheelchair ramp to food court level',
  },
  {
    type: 'accessible_restroom',
    longitude: -79.6435,
    latitude: 43.5928,
    description: 'Accessible restroom near Nordstrom',
  },
  
  // City Centre Transit Terminal
  {
    type: 'wheelchair_entrance',
    longitude: -79.6455,
    latitude: 43.5925,
    description: 'Level access at City Centre Terminal',
  },
  {
    type: 'tactile_paving',
    longitude: -79.6460,
    latitude: 43.5922,
    description: 'Tactile paving at bus platforms',
  },
  
  // Celebration Square
  {
    type: 'ramp',
    longitude: -79.6438,
    latitude: 43.5955,
    description: 'Accessible ramp at Celebration Square',
  },
  {
    type: 'automatic_doors',
    longitude: -79.6440,
    latitude: 43.5950,
    description: 'Automatic doors at Living Arts Centre',
  },
  {
    type: 'accessible_parking',
    longitude: -79.6445,
    latitude: 43.5948,
    description: 'Accessible parking at City Hall',
  },
  
  // Mississauga Central Library
  {
    type: 'elevator',
    longitude: -79.6450,
    latitude: 43.5960,
    description: 'Elevator at Central Library',
  },
  {
    type: 'braille_signage',
    longitude: -79.6448,
    latitude: 43.5958,
    description: 'Braille signage throughout library',
  },
  
  // Sheridan Centre
  {
    type: 'elevator',
    longitude: -79.6500,
    latitude: 43.5900,
    description: 'Elevator access at Sheridan Centre',
  },
  {
    type: 'accessible_restroom',
    longitude: -79.6505,
    latitude: 43.5902,
    description: 'Accessible facilities near food court',
  },
  
  // Near user location - Erin Mills area
  {
    type: 'tactile_paving',
    longitude: -79.6490,
    latitude: 43.5915,
    description: 'Tactile ground surface at intersection',
  },
  {
    type: 'audio_signals',
    longitude: -79.6492,
    latitude: 43.5918,
    description: 'Audio crossing signals at Burnhamthorpe',
  },
  
  // Erin Mills Town Centre
  {
    type: 'elevator',
    longitude: -79.6980,
    latitude: 43.5580,
    description: 'Glass elevators at Erin Mills Town Centre',
  },
  {
    type: 'lowered_counter',
    longitude: -79.6975,
    latitude: 43.5582,
    description: 'Lowered service counter at guest services',
  },
  
  // Port Credit GO Station
  {
    type: 'elevator',
    longitude: -79.5850,
    latitude: 43.5520,
    description: 'Platform elevators at Port Credit GO',
  },
  {
    type: 'ramp',
    longitude: -79.5855,
    latitude: 43.5518,
    description: 'Ramp access to platform',
  },
  {
    type: 'accessible_restroom',
    longitude: -79.5848,
    latitude: 43.5522,
    description: 'Accessible restroom at station',
  },
  
  // Cooksville GO Station
  {
    type: 'automatic_doors',
    longitude: -79.6215,
    latitude: 43.5790,
    description: 'Automatic doors at station entrance',
  },
  {
    type: 'wheelchair_entrance',
    longitude: -79.6210,
    latitude: 43.5792,
    description: 'Accessible entrance at Cooksville GO',
  },
  
  // UTM Campus
  {
    type: 'elevator',
    longitude: -79.6640,
    latitude: 43.5490,
    description: 'Elevator at UTM Student Centre',
  },
  {
    type: 'ramp',
    longitude: -79.6635,
    latitude: 43.5488,
    description: 'Accessible ramp at Instructional Centre',
  },
  
  // Heartland Town Centre
  {
    type: 'accessible_parking',
    longitude: -79.6300,
    latitude: 43.6100,
    description: 'Accessible parking at Heartland',
  },
  {
    type: 'automatic_doors',
    longitude: -79.6305,
    latitude: 43.6095,
    description: 'Automatic doors at IKEA entrance',
  },
];

async function seedDemoData() {
  console.log('🌱 Starting demo data seed...\n');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing demo data (optional - keep user reports)
    const demoUserId = 'demo-seed-data';
    const existingCount = await Report.countDocuments({ userId: demoUserId });
    if (existingCount > 0) {
      console.log(`🗑️  Removing ${existingCount} existing demo reports...`);
      await Report.deleteMany({ userId: demoUserId });
    }

    // Insert demo reports
    console.log(`📍 Creating ${DEMO_REPORTS.length} demo accessibility reports...\n`);
    
    let created = 0;
    for (const reportData of DEMO_REPORTS) {
      // Generate random confirmations (5-20)
      const numConfirmations = Math.floor(Math.random() * 15) + 5;
      const confirmations = Array.from({ length: numConfirmations }, (_, i) => ({
        userId: `demo-confirmer-${i}`,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));
      
      const report = new Report({
        type: reportData.type,
        location: {
          type: 'Point',
          coordinates: [reportData.longitude, reportData.latitude],
        },
        creatorId: demoUserId,
        confirmations: confirmations,
        status: numConfirmations >= 10 ? 'permanent' : 'confirmed',
        isPermanent: numConfirmations >= 10,
        // Set expiry far in future for demo data
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last week
        metadata: {
          source: 'demo-seed',
          name: reportData.description,
        },
      });
      
      await report.save();
      created++;
      console.log(`  ✓ ${reportData.type}: ${reportData.description.substring(0, 50)}...`);
    }

    console.log(`\n✅ Successfully created ${created} demo reports!`);
    
    // Show summary by type
    const summary = await Report.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Reports by type:');
    summary.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
    });

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the seed
seedDemoData();
