import React from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppScreenProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProtectedHomeScreen({ navigation }: AppScreenProps<'ProtectedHome'>) {
    
    // Función para salir del modo protegido (simulada)
    const handleUnlock = async () => {
        await AsyncStorage.removeItem('@app_role'); 
        navigation.replace('Login'); 
    };

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Dispositivo Protegido</Text>
                <Text style={styles.subtitle}>
                    Las aplicaciones y sitios configurados están bloqueados.
                </Text>

                <Text style={styles.pinLabel}>Ingresá el código de 6 dígitos para desbloquear:</Text>

                {/* Simulación de los 6 cuadraditos */}
                <View style={styles.pinContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={styles.pinBox}>
                            <Text style={styles.pinDot}>*</Text>
                        </View>
                    ))}
                </View>

                <Pressable style={styles.button} onPress={handleUnlock}>
                    <Text style={styles.buttonText}>Desbloquear (Simulado)</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    icon: { fontSize: 80, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
    pinLabel: { fontSize: 16, color: '#333', marginBottom: 20, textAlign: 'center' },
    pinContainer: { flexDirection: 'row', gap: 10, marginBottom: 40 },
    pinBox: { width: 40, height: 50, borderWidth: 2, borderColor: '#1976D2', borderRadius: 8, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
    pinDot: { fontSize: 24, fontWeight: 'bold', color: '#1976D2' },
    button: { backgroundColor: '#1976D2', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});