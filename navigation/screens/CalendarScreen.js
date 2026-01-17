import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { styles } from '../../styles/homeStyles';
import LogForm from '../components/LogForm';
import LogItem from '../components/LogItem';
import ExerciseGeneration from './ExerciseGeneration';


export default function CalendarScreen({ navigation }) {
    const [days] = useState([
        {id: '1', day: 'Monday'},
        {id: '2', day: 'Tuesday'},
        {id: '3', day: 'Wednesday'},
        {id: '4', day: 'Thursday'},
        {id: '5', day: 'Friday'},
        {id: '6', day: 'Saturday'},
        {id: '0', day: 'Sunday'},
    ]);

    const [placeholders, setPlaceholders] = useState({
        exercise: '',
        reps: '',
        weight: ''
    });

    const storeData = async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
        console.log('Data stored successfully!');
      } catch (error) {
        console.error('Error storing data:', error);
      }
    };

    useFocusEffect(
      useCallback(() => {
        async function fetchLogs() {
          const stored = await AsyncStorage.getItem('logs');
          if (stored) {
            setLogs(JSON.parse(stored));
          }
        }
        fetchLogs();
      }, [])
    );

    const [logs, setLogs] = useState([]);
    // const [showForm, setShowForm] = useState(false);

    const [activeDay, setActiveDay] = useState(null);

    
    function addLog(newLog) {
        setLogs([newLog, ...logs]);
        storeData('logs', JSON.stringify([newLog, ...logs]));

    }

    function editLog(editedLog) {
        const updatedLogs = logs.map(log => log.exercise === editedLog.exercise ? editedLog : log);
        setLogs(updatedLogs);
        storeData('logs', JSON.stringify(updatedLogs));
    }
    
    // Group logs by day id
    const logsByDay = days.reduce((acc, day) => {
        acc[day.id] = [];
        return acc;
    }, {});
    logs.forEach(log => {
        if (log.dayId && logsByDay[log.dayId]) {
            logsByDay[log.dayId].push(log);
        }
    });

    return (
        <View style={styles.container}>
            <FlatList
                data={days}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={{ flexDirection: 'column' }}>
                        <View style={styles.logItemRow}>
                            <Text style={styles.exercise}>{item.day}</Text>

                            {activeDay === item.id ? null : (
                                <TouchableOpacity
                                    style={[styles.addButton, { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 }]}
                                    onPress={() => {
                                        setActiveDay(item.id);
                                        setPlaceholders({
                                            exercise: 'Exercise',
                                            reps: 'Reps',
                                            weight: 'Weight (lbs)'
                                        });
                                    }}
                                >
                                    <Text style={styles.addButtonText}>+ Add</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {activeDay === item.id ? (
                            <View>
                                <LogForm
                                    onCancel={() => setActiveDay(null)}
                                    onSave={(newLog) => {
                                        
                                        // Normalize exercise name (optional: lowercase + trim)
                                        const newExercise = newLog.exercise.trim().toLowerCase();

                                        // Check if this exercise already exists for this day
                                        const alreadyExists = logs.some(
                                        (log) => log.dayId === item.id && log.exercise.trim().toLowerCase() === newExercise
                                        );

                                        if (alreadyExists) {
                                            editLog({ ...newLog, dayId: item.id, id: logs.find(log => log.dayId === item.id && log.exercise.trim().toLowerCase() === newExercise).id });
                                            setActiveDay(null);
                                            return; // stop execution
                                        }

                                        // Attach the dayId to the log
                                        addLog({ ...newLog, dayId: item.id, id: Date.now().toString() });
                                        setActiveDay(null);
                                        
                                    }}
                                    placeholderExercise={placeholders.exercise}
                                    placeholderReps={placeholders.reps}
                                    placeholderWeight={placeholders.weight}
                                />
                            </View>
                        ) : null}

                            <FlatList
                                data={logsByDay[item.id]}
                                keyExtractor={(log) => log.id}
                                renderItem={({ item: log }) => (
                                <LogItem 
                                    item={log} 
                                    checkBox={false} 
                                    onDelete={(id) => {
                                    const updatedLogs = logs.filter((l) => l.id !== id);
                                    setLogs(updatedLogs);

                                    // Persist changes
                                    storeData('logs', JSON.stringify(updatedLogs));
                                    }}
                                    setOnEdit={() => {
                                        setActiveDay(item.id);
                                        // Get info of this log for the placeholders
                                        setPlaceholders({
                                            exercise: log.exercise || 'Exercise',
                                            reps: log.reps || 'Reps',
                                            weight: log.weight || 'Weight (lbs)'
                                        });
                                    }}
                                    onEdit={true}
                                />
                            )}
                                contentContainerStyle={styles.list}
                                ListEmptyComponent={<Text style={styles.empty}>No logs yet — add your first workout.</Text>}
                            />
                    </View>
                )}
                contentContainerStyle={styles.list}
            />
            <ExerciseGeneration />
        </View>
    );
}