import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="home-outline" size={64} color="tomato" />
    </View>
  );
}

