import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import Mapbox from '@rnmapbox/maps';

// Set your Mapbox access token here
// Get your token from: https://console.mapbox.com/account/access-tokens/
Mapbox.setAccessToken('pk.eyJ1Ijoic3BsaXhlbnQiLCJhIjoiY21raXI3MW94MHh2ajNmcHNiaWU3dWJtbyJ9.tj2YzAw5qlteRPcpSczTsg');

function App() {
  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Mapbox.MapView 
        style={styles.map}
        styleURL="mapbox://styles/mapbox/streets-v12"
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        <Mapbox.Camera
          zoomLevel={14}
          centerCoordinate={[-122.4194, 37.7749]} // San Francisco coordinates
          animationMode="flyTo"
          animationDuration={2000}
        />
        <Mapbox.LocationPuck
          puckBearing="heading"
          puckBearingEnabled={true}
          visible={true}
        />
      </Mapbox.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default App;