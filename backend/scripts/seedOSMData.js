/**
 * Seed OpenStreetMap Data Script
 * Fetches real accessibility-relevant places from OpenStreetMap Overpass API
 * within 10km of a specified location - NO API KEY REQUIRED
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Center location (Mississauga - Square One area)
const CENTER_LAT = 43.5933;
const CENTER_LNG = -79.6426;
const RADIUS_METERS = 10000; // 10km

// Overpass API endpoint
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// OSM queries for accessibility-relevant places
const OSM_QUERIES = [
  {
    name: 'Transit Stations',
    query: `[out:json][timeout:30];
      (
        node["railway"="station"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["railway"="halt"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["public_transport"="station"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="bus_station"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out body;`,
    accessibilityTypes: ['elevator', 'ramp', 'tactile_paving', 'wheelchair_entrance', 'audio_signals'],
  },
  {
    name: 'Hospitals & Clinics',
    query: `[out:json][timeout:30];
      (
        node["amenity"="hospital"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="clinic"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="hospital"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'wheelchair_entrance', 'accessible_restroom', 'automatic_doors'],
  },
  {
    name: 'Shopping',
    query: `[out:json][timeout:30];
      (
        node["shop"="mall"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["shop"="supermarket"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["shop"="department_store"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["shop"="mall"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["shop"="supermarket"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'accessible_parking', 'automatic_doors'],
  },
  {
    name: 'Libraries',
    query: `[out:json][timeout:30];
      (
        node["amenity"="library"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="library"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'ramp', 'braille_signage', 'accessible_restroom', 'wheelchair_entrance'],
  },
  {
    name: 'Education',
    query: `[out:json][timeout:30];
      (
        node["amenity"="university"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="college"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="school"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="university"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="college"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'automatic_doors'],
  },
  {
    name: 'Government',
    query: `[out:json][timeout:30];
      (
        node["amenity"="townhall"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="community_centre"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["office"="government"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="townhall"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="community_centre"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'ramp', 'accessible_restroom', 'wheelchair_entrance'],
  },
  {
    name: 'Restaurants & Cafes',
    query: `[out:json][timeout:30];
      (
        node["amenity"="restaurant"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="cafe"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="fast_food"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out body;`,
    accessibilityTypes: ['wheelchair_entrance', 'accessible_table', 'accessible_restroom'],
    maxResults: 50, // Limit restaurants as there are many
  },
  {
    name: 'Banks & ATMs',
    query: `[out:json][timeout:30];
      (
        node["amenity"="bank"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="atm"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out body;`,
    accessibilityTypes: ['wheelchair_entrance', 'lowered_counter', 'automatic_doors'],
    maxResults: 30,
  },
  {
    name: 'Pharmacies',
    query: `[out:json][timeout:30];
      (
        node["amenity"="pharmacy"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out body;`,
    accessibilityTypes: ['wheelchair_entrance', 'lowered_counter', 'automatic_doors'],
  },
  {
    name: 'Parks & Recreation',
    query: `[out:json][timeout:30];
      (
        node["leisure"="park"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["leisure"="sports_centre"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["leisure"="fitness_centre"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["leisure"="park"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['ramp', 'accessible_parking', 'accessible_restroom', 'tactile_paving'],
    maxResults: 40,
  },
  {
    name: 'Places of Worship',
    query: `[out:json][timeout:30];
      (
        node["amenity"="place_of_worship"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="place_of_worship"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['ramp', 'wheelchair_entrance', 'accessible_restroom'],
    maxResults: 30,
  },
  {
    name: 'Entertainment',
    query: `[out:json][timeout:30];
      (
        node["amenity"="cinema"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["amenity"="theatre"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["tourism"="museum"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["amenity"="cinema"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        way["tourism"="museum"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out center;`,
    accessibilityTypes: ['elevator', 'wheelchair_entrance', 'accessible_restroom'],
  },
  {
    name: 'Crosswalks with Signals',
    query: `[out:json][timeout:30];
      (
        node["highway"="crossing"]["crossing"="traffic_signals"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
        node["highway"="traffic_signals"](around:${RADIUS_METERS},${CENTER_LAT},${CENTER_LNG});
      );
      out body;`,
    accessibilityTypes: ['tactile_paving', 'audio_signals'],
    maxResults: 50,
  },
];

// Accessibility type descriptions
const ACCESSIBILITY_DESCRIPTIONS = {
  elevator: 'Elevator access',
  ramp: 'Wheelchair ramp',
  accessible_restroom: 'Accessible restroom',
  wheelchair_entrance: 'Wheelchair entrance',
  accessible_parking: 'Accessible parking',
  tactile_paving: 'Tactile paving',
  audio_signals: 'Audio signals',
  braille_signage: 'Braille signage',
  automatic_doors: 'Automatic doors',
  lowered_counter: 'Lowered counter',
  accessible_table: 'Accessible seating',
  service_animal: 'Service animals welcome',
};

// Fetch places from Overpass API
async function fetchOSMPlaces(queryConfig) {
  try {
    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(queryConfig.query)}`,
    });
    
    if (!response.ok) {
      console.warn(`  ⚠️  HTTP ${response.status} for ${queryConfig.name}`);
      return [];
    }
    
    const data = await response.json();
    let elements = data.elements || [];
    
    // Apply max results limit if specified
    if (queryConfig.maxResults && elements.length > queryConfig.maxResults) {
      // Shuffle and take random subset
      elements = elements.sort(() => Math.random() - 0.5).slice(0, queryConfig.maxResults);
    }
    
    return elements;
  } catch (error) {
    console.error(`  ❌ Error fetching ${queryConfig.name}:`, error.message);
    return [];
  }
}

// Add small random offset to coordinates
function addOffset(coord, maxOffset = 0.0002) {
  return coord + (Math.random() - 0.5) * maxOffset * 2;
}

// Get name from OSM tags
function getPlaceName(element) {
  if (element.tags) {
    return element.tags.name || element.tags['name:en'] || element.tags.operator || 'Unknown location';
  }
  return 'Unknown location';
}

// Get coordinates from element (handle both nodes and ways)
function getCoordinates(element) {
  if (element.lat && element.lon) {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.center) {
    return { lat: element.center.lat, lng: element.center.lon };
  }
  return null;
}

async function seedOSMData() {
  console.log('🗺️  Starting OpenStreetMap data seed...\n');
  console.log(`📍 Center: (${CENTER_LAT}, ${CENTER_LNG})`);
  console.log(`📏 Radius: ${RADIUS_METERS / 1000}km\n`);
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing OSM data
    const osmUserId = 'openstreetmap-seed';
    const existingCount = await Report.countDocuments({ creatorId: osmUserId });
    if (existingCount > 0) {
      console.log(`🗑️  Removing ${existingCount} existing OSM reports...`);
      await Report.deleteMany({ creatorId: osmUserId });
    }

    console.log('🔍 Fetching places from OpenStreetMap...\n');
    
    let totalCreated = 0;
    const processedLocations = new Set();
    
    for (const queryConfig of OSM_QUERIES) {
      console.log(`📌 ${queryConfig.name}...`);
      
      const elements = await fetchOSMPlaces(queryConfig);
      console.log(`   Found ${elements.length} places`);
      
      let categoryCreated = 0;
      
      for (const element of elements) {
        const coords = getCoordinates(element);
        if (!coords) continue;
        
        const placeName = getPlaceName(element);
        const locationKey = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
        
        // Skip if we've already processed this exact location
        if (processedLocations.has(locationKey)) continue;
        processedLocations.add(locationKey);
        
        // Pick 1-2 random accessibility types for this place
        const numTypes = Math.floor(Math.random() * 2) + 1;
        const shuffledTypes = [...queryConfig.accessibilityTypes].sort(() => Math.random() - 0.5);
        const selectedTypes = shuffledTypes.slice(0, numTypes);
        
        for (const accType of selectedTypes) {
          // Add small offset if multiple features at same place
          const offsetLat = selectedTypes.length > 1 ? addOffset(coords.lat) : coords.lat;
          const offsetLng = selectedTypes.length > 1 ? addOffset(coords.lng) : coords.lng;
          
          // Generate random confirmations (5-20)
          const numConfirmations = Math.floor(Math.random() * 15) + 5;
          const confirmations = Array.from({ length: numConfirmations }, (_, i) => ({
            userId: `osm-confirmer-${i}`,
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          }));
          
          const report = new Report({
            type: accType,
            location: {
              type: 'Point',
              coordinates: [offsetLng, offsetLat],
            },
            creatorId: osmUserId,
            confirmations: confirmations,
            status: numConfirmations >= 10 ? 'permanent' : 'confirmed',
            isPermanent: numConfirmations >= 10,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            metadata: {
              source: 'openstreetmap',
              osmId: element.id,
              osmType: element.type,
              placeName: placeName,
              name: `${ACCESSIBILITY_DESCRIPTIONS[accType]} at ${placeName}`,
            },
          });
          
          await report.save();
          totalCreated++;
          categoryCreated++;
        }
      }
      
      console.log(`   Created ${categoryCreated} accessibility reports\n`);
      
      // Delay between queries to be nice to Overpass API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Successfully created ${totalCreated} accessibility reports from ${processedLocations.size} unique locations!`);
    
    // Show summary by type
    const summary = await Report.aggregate([
      { $match: { creatorId: osmUserId } },
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
seedOSMData();
