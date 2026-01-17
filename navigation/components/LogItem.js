import { useState } from 'react';

import Checkbox from 'expo-checkbox';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { styles } from '../../styles/homeStyles';


export default function LogItem({ item, checkBox, onDelete, setOnEdit, onEdit}) {

    const [checked, setChecked] = useState(false);

    const renderRightActions = () => (
        <TouchableOpacity 
        style={styles.deleteBox} 
        onPress={() => onDelete(item.id)}   // delete log by id
        >
        <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
    );


    // const [onEdit, setOnEdit] = useState(false);

    // console.log("checkBox:", checkBox);

    return (
        <Swipeable renderRightActions={renderRightActions}>

        <View style={styles.logItem}>
            <View style={{ flexDirection: 'column' }}>
                <Text style={styles.exercise}>{item.exercise}</Text>
                <Text style={styles.meta}>{item.reps} reps · {item.weight} lbs</Text>
            </View>

            {checkBox ? (
                <View style={{ marginRight: 10 }}>
                    <Checkbox value={checked} onValueChange={setChecked} />
                </View>
            ) : null}
            {onEdit ? (
                <TouchableOpacity
                    style={{ paddingVertical: 6, paddingHorizontal: 15 }}
                    onPress={() => setOnEdit(item.id)}>
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
            ) : null}
               
        </View>
        </Swipeable>

    );
}