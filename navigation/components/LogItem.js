import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function LogItem({ item, onDelete, setOnEdit }) {
    // Quality is stored in 'weight' for storage compatibility
    const qualityValue = parseInt(item.weight) || 0;

    return (
        <View style={styles.card}>
            <View style={styles.mainContent}>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>{item.exercise}</Text>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity onPress={setOnEdit} style={styles.iconButton}>
                            <Ionicons name="pencil" size={18} color="#007bff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.iconButton}>
                            <Ionicons name="trash-outline" size={20} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* DISPLAY PHOTO IF IT EXISTS */}
                {item.photo && (
                    <Image 
                        source={{ uri: item.photo }} 
                        style={styles.reportImage} 
                        resizeMode="cover"
                    />
                )}
                
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
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: { 
        backgroundColor: 'white', 
        marginHorizontal: 15, 
        marginVertical: 8, 
        padding: 15, 
        borderRadius: 12, 
        borderWidth: 1, 
        borderColor: '#efefef',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    mainContent: { flex: 1 },
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8
    },
    title: { fontSize: 18, fontWeight: 'bold', color: '#2d3436' },
    actionButtons: { flexDirection: 'row' },
    iconButton: { marginLeft: 15 },
    reportImage: {
        width: '100%',
        height: 180,
        borderRadius: 8,
        marginVertical: 10,
        backgroundColor: '#f1f2f6'
    },
    qualityRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    qualityText: { fontSize: 13, color: '#636e72', marginLeft: 5, fontWeight: '600' },
    description: { fontSize: 15, color: '#636e72', marginTop: 4 },
    dateText: { fontSize: 11, color: '#b2bec3', marginTop: 10, textAlign: 'right' }
});