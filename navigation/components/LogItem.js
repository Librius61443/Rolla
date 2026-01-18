import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LogItem({ item, onDelete, setOnEdit }) {
    // We now treat the weight data as 'Quality'
    const qualityValue = parseInt(item.weight) || 0;

    return (
        <View style={styles.card}>
            <View style={styles.mainContent}>
                <Text style={styles.title}>{item.exercise}</Text>
                
                <View style={styles.qualityRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons 
                            key={s} 
                            name={s <= qualityValue ? "star" : "star-outline"} 
                            size={16} 
                            color="#f1c40f" 
                        />
                    ))}
                    <Text style={styles.qualityText}> Quality: {qualityValue}/5</Text>
                </View>

                <Text style={styles.description}>{item.reps}</Text>
            </View>
            
            <View style={styles.actionColumn}>
                <TouchableOpacity onPress={setOnEdit} style={styles.editButton}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { 
        flexDirection: 'row', 
        backgroundColor: 'white', 
        marginHorizontal: 15, 
        marginVertical: 6, 
        padding: 12, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#efefef' 
    },
    mainContent: { flex: 1 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#2d3436' },
    qualityRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    qualityText: { fontSize: 12, color: '#636e72', marginLeft: 5, fontWeight: '500' },
    description: { fontSize: 14, color: '#636e72' },
    actionColumn: { alignItems: 'flex-end', justifyContent: 'space-between' },
    editButton: { padding: 5 },
    editText: { color: '#007bff', fontWeight: '600' }
});