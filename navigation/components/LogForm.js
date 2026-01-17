import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/homeStyles';


export default function LogForm({ onSave, onCancel, placeholderExercise, placeholderReps, placeholderWeight }) {
    const [exercise, setExercise] = useState('');
    const [reps, setReps] = useState('');
    const [weight, setWeight] = useState('');
    const [placeholders] = useState({
        exercise: typeof placeholderExercise === 'string' ? placeholderExercise : null,
        reps: typeof placeholderReps === 'number' ? placeholderReps : null,
        weight: typeof placeholderWeight === 'number' ? placeholderWeight : null,
    });

    function handleSave() {
        if (!exercise.trim() || !reps.trim()){
            if(placeholders.exercise === 'Exercise' || placeholders.reps === 'Reps' || placeholders.weight === 'Weight (lbs)'){
                return;
            }
        };
        const newLog = {
            id: Date.now().toString(),
            exercise: exercise ? exercise.trim() : placeholders.exercise,
            reps: reps ? Number(reps) : Number(placeholders.reps),
            weight: weight ? Number(weight) : Number(placeholders.weight),
        };
        onSave(newLog);
        setExercise('');
        setReps('');
        setWeight('');
    }


    return (
        <View style={styles.form}>
        <TextInput
            placeholder={placeholders.exercise || 'Exercise'}
            placeholderTextColor={"#656060ff"}
            value={exercise}
            onChangeText={setExercise}
            style={styles.input}
        />
        <TextInput
            placeholder={placeholders.reps?.toString() || 'Reps'}
            placeholderTextColor={"#656060ff"}
            value={reps}
            onChangeText={setReps}
            keyboardType="numeric"
            style={styles.input}
        />
        <TextInput
            placeholder={placeholders.weight?.toString() || 'Weight (lbs)'}
            placeholderTextColor={"#656060ff"}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            style={styles.input}
        />


        <View style={styles.formRow}>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
        <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
        <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
        </View>
        </View>
    );
}