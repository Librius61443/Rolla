/**
 * Import Accessibility Data Script
 * Fetches accessibility information from Google Maps Places API
 * and populates the database with initial reports
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Configuration - Add your API key to .env file
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Default location (Melbourne CBD) - change as needed
const DEFAULT_CENTER = {
  latitude: -37.8136,
  longitude: 144.9631,
};

// Search radius in meters
const SEARCH_RADIUS = 2000;

// Map Google Places types to our accessibility types
const PLACE_TYPE_MAPPING = {
  // Places likely to have elevators
  'hospital': 'elevator',
  'shopping_mall': 'elevator',
  'department_store': 'elevator',
  'train_station': 'elevator',
  'subway_station': 'elevator',
  
  // Parking
  'parking': 'accessible_parking',
  
  // Places with accessible restrooms
  'library': 'accessible_restroom',
  'museum': 'accessible_restroom',
  'city_hall': 'accessible_restroom',
  
  // Places with automatic doors
  'supermarket': 'automatic_doors',
  'pharmacy': 'automatic_doors',
  'bank': 'automatic_doors',
  
  // Transit with ramps/accessibility
  'bus_station': 'ramp',
  'light_rail_station': 'ramp',
};

/**
 * Fetch places from Google Maps Places API (New)
 */
async function fetchGooglePlaces(latitude, longitude, radius = SEARCH_RADIUS) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.log('⚠️  GOOGLE_MAPS_API_KEY not set, skipping Google Places import');
    return [];
  }

  console.log('📍 Fetching places from Google Maps...');
  
  const places = [];
  
  // Search for different place types
  const placeTypes = Object.keys(PLACE_TYPE_MAPPING);
  
  for (const placeType of placeTypes) {
    try {
      // Using Google Places API (New) - Nearby Search
      const url = 'https://places.googleapis.com/v1/places:searchNearby';
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.accessibilityOptions,places.types',
        },
        body: JSON.stringify({
          includedTypes: [placeType],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude, longitude },
              radius: radius,
            },
          },
        }),
      });

      if (!response.ok) {
        console.warn(`  ⚠️  Failed to fetch ${placeType}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      if (data.places) {
        for (const place of data.places) {
          // Check if place has accessibility options
          const accessibility = place.accessibilityOptions || {};
          
          // Only include places with wheelchair accessible entrance
          if (accessibility.wheelchairAccessibleEntrance || 
              accessibility.wheelchairAccessibleParking ||
              accessibility.wheelchairAccessibleRestroom) {
            
            const accessibilityTypes = [];
            
            if (accessibility.wheelchairAccessibleEntrance) {
              accessibilityTypes.push('wheelchair_entrance');
            }
            if (accessibility.wheelchairAccessibleParking) {
              accessibilityTypes.push('accessible_parking');
            }
            if (accessibility.wheelchairAccessibleRestroom) {
              accessibilityTypes.push('accessible_restroom');
            }
            
            // Also add the mapped type
            const mappedType = PLACE_TYPE_MAPPING[placeType];
            if (mappedType && !accessibilityTypes.includes(mappedType)) {
              accessibilityTypes.push(mappedType);
            }
            
            for (const accType of accessibilityTypes) {
              places.push({
                type: accType,
                latitude: place.location.latitude,
                longitude: place.location.longitude,
                source: 'google_places',
                name: place.displayName?.text || 'Unknown',
                placeId: place.id,
              });
            }
          }
        }
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.warn(`  ⚠️  Error fetching ${placeType}:`, error.message);
    }
  }
  
  console.log(`  ✅ Found ${places.length} accessible places from Google`);
  return places;
}

/**
 * Import places into the database
 */
async function importPlaces(places) {
  console.log('\n📥 Importing places into database...');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const place of places) {
    try {
      // Check if a similar report already exists nearby
      const existing = await Report.findDuplicate(
        place.type,
        place.longitude,
        place.latitude
      );
      
      if (existing) {
        skipped++;
        continue;
      }
      
      // Create a new report
      const report = new Report({
        type: place.type,
        location: {
          type: 'Point',
          coordinates: [place.longitude, place.latitude],
        },
        creatorId: `import-${place.source}`,
        photos: [], // No photos for imported data
        confirmations: [{ userId: `import-${place.source}` }],
        // Make imported data semi-permanent (needs 5 more confirmations)
        status: 'active',
        metadata: {
          source: place.source,
          name: place.name,
          externalId: place.placeId || place.stopId,
        },
      });
      
      await report.save();
      imported++;
      
    } catch (error) {
      errors++;
      console.warn(`  ⚠️  Error importing place:`, error.message);
    }
  }
  
  console.log(`\n📊 Import Results:`);
  console.log(`   ✅ Imported: ${imported}`);
  console.log(`   ⏭️  Skipped (duplicates): ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Accessibility Data Import\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  let latitude = DEFAULT_CENTER.latitude;
  let longitude = DEFAULT_CENTER.longitude;
  let radius = SEARCH_RADIUS;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--lat' && args[i + 1]) {
      latitude = parseFloat(args[i + 1]);
    } else if (args[i] === '--lng' && args[i + 1]) {
      longitude = parseFloat(args[i + 1]);
    } else if (args[i] === '--radius' && args[i + 1]) {
      radius = parseInt(args[i + 1]);
    }
  }
  
  console.log(`📍 Location: ${latitude}, ${longitude}`);
  console.log(`📏 Radius: ${radius}m\n`);
  
  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
  
  // Fetch data from Google Maps
  const places = await fetchGooglePlaces(latitude, longitude, radius);
  
  console.log(`\n📊 Total places found: ${places.length}`);
  
  if (places.length > 0) {
    await importPlaces(places);
  } else {
    console.log('\n⚠️  No accessible places found. Make sure:');
    console.log('   1. GOOGLE_MAPS_API_KEY is set in backend/.env');
    console.log('   2. Places API (New) is enabled in Google Cloud Console');
    console.log('   3. The location has places with accessibility data');
  }
  
  // Disconnect from MongoDB
  await mongoose.disconnect();
  console.log('\n✅ Import complete!');
}

// Run the script
main().catch(console.error);
