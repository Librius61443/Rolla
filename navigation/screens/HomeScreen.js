import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import MapView from 'react-native-maps';
import React, { useState, useEffect } from 'react';
import { customStyleJson } from '../../styles/mapStyles';
//
import { getCurrentCoordinates } from '../../location/CurrentLocation';
// import Mapbox, {MapView} from "@rnmapbox/maps";

// Mapbox.setAccessToken("pk.eyJ1Ijoic3BsaXhlbnQiLCJhIjoiY21raXI3MW94MHh2ajNmcHNiaWU3dWJtbyJ9.tj2YzAw5qlteRPcpSczTsg");


export default function HomeScreen() {
  const [initialRegion, setInitialRegion] = useState(null);

  useEffect(() => {
    (async () => {
      const coords = await getCurrentCoordinates();
      if (!coords) return;

      setInitialRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

    // Render full-screen map
    return (
      <View style={{ flex: 1 }}>
        <MapView
          provider='google'
          style={{ flex: 1 }}
          initialRegion={initialRegion}
          // onRegionChangeComplete={(r) => setRegion(r)}
          customMapStyle={customStyleJson}
        />
      </View>
    );
}