import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Verified imports
import MapScreen from './screens/MapScreen';
import SavedPinsScreen from './screens/SavedPinsScreen';
import CameraScreen from './screens/CameraScreen';
import GalleryScreen from './screens/GalleryScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function MainContainer() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Map"
        screenOptions={({ route }) => ({
          headerShown: true,
          tabBarActiveTintColor: '#007bff',
          tabBarIcon: ({ color, size, focused }) => {
            let iconName;
            if (route.name === 'Map') iconName = focused ? 'map' : 'map-outline';
            else if (route.name === 'Saved Reports') iconName = focused ? 'list' : 'list-outline';
            else if (route.name === 'Camera') iconName = focused ? 'camera' : 'camera-outline';
            else if (route.name === 'Gallery') iconName = focused ? 'images' : 'images-outline';
            else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Saved Reports" component={SavedPinsScreen} />
        <Tab.Screen name="Camera" component={CameraScreen} />
        <Tab.Screen name="Gallery" component={GalleryScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}