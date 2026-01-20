/**
 * Seed Google Places Data Script
 * Fetches real accessibility-relevant places from Google Maps Places API
 * within specified radius of a location
 * 
 * Usage: node seedGooglePlacesData.js [latitude] [longitude] [radius_km]
 * Example: node seedGooglePlacesData.js 43.777118 -79.502237 2
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Parse command line arguments or use defaults
const CENTER_LAT = parseFloat(process.argv[2]) || 43.5933;
const CENTER_LNG = parseFloat(process.argv[3]) || -79.6426;
const RADIUS_KM = parseFloat(process.argv[4]) || 10;
const RADIUS_METERS = RADIUS_KM * 1000;

// Google Maps API Key - add to your .env file as GOOGLE_MAPS_API_KEY
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Place types that typically have accessibility features
const PLACE_TYPES_TO_SEARCH = [
  { type: 'transit_station', accessibilityTypes: ['elevator', 'ramp', 'tactile_paving', 'wheelchair_entrance'] },
  { type: 'subway_station', accessibilityTypes: ['elevator', 'tactile_paving', 'audio_signals'] },
  { type: 'train_station', accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'tactile_paving'] },
  { type: 'bus_station', accessibilityTypes: ['ramp', 'tactile_paving', 'audio_signals'] },
  { type: 'hospital', accessibilityTypes: ['elevator', 'wheelchair_entrance', 'accessible_restroom', 'automatic_doors'] },
  { type: 'shopping_mall', accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'accessible_parking'] },
  { type: 'library', accessibilityTypes: ['elevator', 'ramp', 'braille_signage', 'accessible_restroom'] },
  { type: 'university', accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'automatic_doors'] },
  { type: 'city_hall', accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'wheelchair_entrance'] },
  { type: 'museum', accessibilityTypes: ['elevator', 'ramp', 'wheelchair_entrance', 'accessible_restroom'] },
  { type: 'park', accessibilityTypes: ['ramp', 'accessible_parking', 'tactile_paving'] },
  { type: 'restaurant', accessibilityTypes: ['wheelchair_entrance', 'accessible_table', 'accessible_restroom'] },
  { type: 'pharmacy', accessibilityTypes: ['wheelchair_entrance', 'lowered_counter', 'automatic_doors'] },
  { type: 'bank', accessibilityTypes: ['wheelchair_entrance', 'lowered_counter', 'automatic_doors'] },
  { type: 'supermarket', accessibilityTypes: ['wheelchair_entrance', 'accessible_parking', 'automatic_doors'] },
  { type: 'gym', accessibilityTypes: ['elevator', 'wheelchair_entrance', 'accessible_restroom'] },
  { type: 'movie_theater', accessibilityTypes: ['elevator', 'wheelchair_entrance', 'accessible_restroom'] },
  { type: 'church', accessibilityTypes: ['ramp', 'wheelchair_entrance', 'accessible_restroom'] },
  { type: 'post_office', accessibilityTypes: ['wheelchair_entrance', 'lowered_counter'] },
  { type: 'courthouse', accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'wheelchair_entrance'] },
];

// Accessibility type descriptions
const ACCESSIBILITY_DESCRIPTIONS = {
  elevator: 'Elevator access available',
  ramp: 'Wheelchair ramp available',
  accessible_restroom: 'Accessible restroom facilities',
  wheelchair_entrance: 'Wheelchair accessible entrance',
  accessible_parking: 'Accessible parking spaces',
  tactile_paving: 'Tactile paving for visually impaired',
  audio_signals: 'Audio signals for accessibility',
  braille_signage: 'Braille signage available',
  automatic_doors: 'Automatic door entry',
  lowered_counter: 'Lowered service counter',
  accessible_table: 'Accessible seating/tables',
  service_animal: 'Service animals welcome',
};

// Fetch places from Google Places API
async function fetchPlaces(type) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${CENTER_LAT},${CENTER_LNG}&radius=${RADIUS_METERS}&type=${type}&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results) {
      return data.results;
    } else if (data.status === 'ZERO_RESULTS') {
      return [];
    } else {
      console.warn(`  ⚠️  API warning for ${type}: ${data.status}`);
      return [];
    }
  } catch (error) {
    console.error(`  ❌ Error fetching ${type}:`, error.message);
    return [];
  }
}

// Add small random offset to coordinates to spread accessibility features
function addOffset(coord, maxOffset = 0.0003) {
  return coord + (Math.random() - 0.5) * maxOffset * 2;
}

async function seedGooglePlacesData() {
  console.log('🌍 Starting Google Places data seed...\n');
  
  if (!GOOGLE_API_KEY) {
    console.error('❌ GOOGLE_MAPS_API_KEY not found in environment variables!');
    console.log('   Add GOOGLE_MAPS_API_KEY=your_api_key to backend/.env');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing Google Places demo data
    const googleUserId = 'google-places-seed';
    const existingCount = await Report.countDocuments({ creatorId: googleUserId });
    if (existingCount > 0) {
      console.log(`🗑️  Removing ${existingCount} existing Google Places reports...`);
      await Report.deleteMany({ creatorId: googleUserId });
    }

    console.log(`📍 Fetching places within ${RADIUS_METERS / 1000}km of (${CENTER_LAT}, ${CENTER_LNG})...\n`);
    
    let totalCreated = 0;
    const processedPlaces = new Set(); // Track processed place IDs to avoid duplicates
    
    for (const searchConfig of PLACE_TYPES_TO_SEARCH) {
      console.log(`🔍 Searching for: ${searchConfig.type}...`);
      
      const places = await fetchPlaces(searchConfig.type);
      console.log(`   Found ${places.length} places`);
      
      for (const place of places) {
        // Skip if already processed
        if (processedPlaces.has(place.place_id)) {
          continue;
        }
        processedPlaces.add(place.place_id);
        
        const lat = place.geometry.location.lat;
        const lng = place.geometry.location.lng;
        
        // Pick 1-3 random accessibility types for this place
        const numTypes = Math.floor(Math.random() * 3) + 1;
        const shuffledTypes = [...searchConfig.accessibilityTypes].sort(() => Math.random() - 0.5);
        const selectedTypes = shuffledTypes.slice(0, numTypes);
        
        for (const accType of selectedTypes) {
          // Add small offset so features aren't all at exact same spot
          const offsetLat = selectedTypes.length > 1 ? addOffset(lat) : lat;
          const offsetLng = selectedTypes.length > 1 ? addOffset(lng) : lng;
          
          // Generate random confirmations (3-15)
          const numConfirmations = Math.floor(Math.random() * 12) + 3;
          const confirmations = Array.from({ length: numConfirmations }, (_, i) => ({
            userId: `google-confirmer-${i}`,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          }));
          
          const report = new Report({
            type: accType,
            location: {
              type: 'Point',
              coordinates: [offsetLng, offsetLat],
            },
            creatorId: googleUserId,
            confirmations: confirmations,
            status: numConfirmations >= 10 ? 'permanent' : 'confirmed',
            isPermanent: numConfirmations >= 10,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            metadata: {
              source: 'google-places',
              placeId: place.place_id,
              placeName: place.name,
              placeAddress: place.vicinity,
              placeType: searchConfig.type,
              name: `${ACCESSIBILITY_DESCRIPTIONS[accType]} at ${place.name}`,
            },
          });
          
          await report.save();
          totalCreated++;
        }
      }
      
      // Small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n✅ Successfully created ${totalCreated} accessibility reports from ${processedPlaces.size} unique places!`);
    
    // Show summary by type
    const summary = await Report.aggregate([
      { $match: { creatorId: googleUserId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📊 Reports by accessibility type:');
    summary.forEach(({ _id, count }) => {
      console.log(`   ${_id}: ${count}`);
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
seedGooglePlacesData();
