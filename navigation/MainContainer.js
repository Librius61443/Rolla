import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Fix: Import names must match the files in your sidebar
import MapScreen from './screens/MapScreen';
import SavedPinsScreen from './screens/SavedPinsScreen';
import SettingsScreen from './screens/SettingsScreen';
import CameraScreen from './screens/CameraScreen';

// Human-friendly labels for your demo
const mapName = "Map";
const savedPinsName = "Saved Reports";
const settingsName = "Settings";
const cameraName = "Camera";

const Tab = createBottomTabNavigator();

function MainContainer() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName={mapName}
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            let rn = route.name;

            if (rn === mapName) {
              iconName = focused ? 'map' : 'map-outline';
            } else if (rn === savedPinsName) {
              iconName = focused ? 'list' : 'list-outline';
            } else if (rn === settingsName) {
              iconName = focused ? 'settings' : 'settings-outline';
            } else if (rn === cameraName) {
              iconName = focused ? 'camera' : 'camera-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: 'grey',
          tabBarLabelStyle: { paddingBottom: 10, fontSize: 10 },
          tabBarStyle: { padding: 10, height: 70 }
        })}>

        <Tab.Screen name={mapName} component={MapScreen} />
        <Tab.Screen name={savedPinsName} component={SavedPinsScreen} />
        <Tab.Screen name={cameraName} component={CameraScreen} />
        <Tab.Screen name={settingsName} component={SettingsScreen} />

      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default MainContainer;