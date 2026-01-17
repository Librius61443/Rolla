import { StyleSheet } from 'react-native';


export const styles = StyleSheet.create({
    
    container: { flex: 1, backgroundColor: '#fff', padding: 20 },
    
    header: { marginTop: 30, marginBottom: 10 },
    
    title: { fontSize: 32, fontWeight: '700' },
    
    subtitle: { color: '#666', marginTop: 4 },
    
    addButton: {
        backgroundColor: '#0a84ff',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 12,
    },

    hoverButton: {
        position: 'absolute',
        bottom: 1,   // distance from bottom
        // right: 30,    // distance from right
        zIndex: 10,   // ensures it sits above other elements
        backgroundColor: '#0a84ff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
    },

    NotificationButton: {
        backgroundColor: '#0a84ff',
        borderRadius: 100,
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
        // marginVertical: 5,
        // paddingVertical: 3,
        paddingHorizontal: 10,
        fontSize: 15,
        color: '#fff',
        fontWeight: '600'

    },
    
    addButtonText: { color: '#fff', fontWeight: '600', fontSize: 16},
    
    form: { backgroundColor: '#f6f7fb', padding: 12, borderRadius: 10, marginVertical: 8 },
    
    input: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginVertical: 6, borderWidth: 1, borderColor: '#0e0b0bff' },
    
    formRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    
    button: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
    
    cancelButton: { backgroundColor: '#919191ff' },
    
    saveButton: { backgroundColor: '#0a84ff' },
    
    buttonText: { color: '#fff', fontWeight: '600' },
    
    list: { paddingBottom: 40 },
    
    logItem: { backgroundColor: '#f8f9fb', padding: 14, borderRadius: 30, marginVertical: 6, borderWidth: 1, borderColor: '#eee', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    
    exercise: { fontSize: 16, fontWeight: '600' },

    meta: { color: '#666', marginTop: 4 },

    empty: { color: '#999', textAlign: 'center', marginTop: 20 },
    
    logItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 25,
    marginBottom: 10,
    },

    deleteBox: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderRadius: 30,
    marginVertical: 6,
    marginLeft: 10,
    padding: 15
    },
    deleteText: {
    color: '#fff',
    fontWeight: 'bold',
    },

});