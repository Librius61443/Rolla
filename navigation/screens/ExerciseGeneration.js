import { Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/homeStyles';

function ExerciseGeneration() {
    return (
        <View>
            <TouchableOpacity
                style={[styles.hoverButton, { alignSelf: 'flex-start', paddingBottom: 10}]}
                onPress={() => {
                  // const hours = time.getHours();
                  // const minutes = time.getMinutes();
                alert('Feature coming soon!');
            }}
            >
            <Text style={{ color: 'white', fontSize: 24, paddingTop: 5 }}>+</Text>
        </TouchableOpacity>
        </View>
    );
}

export default ExerciseGeneration;
