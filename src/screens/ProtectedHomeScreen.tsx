import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { pairingApi } from '../services/api'; // Asegúrate que la ruta sea correcta
import type { AppScreenProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProtectedHomeScreen({ navigation }: AppScreenProps<'ProtectedHome'>) {
    const [codigo, setCodigo] = useState('');
    const [estaVinculado, setEstaVinculado] = useState(false); 
    const [loading, setLoading] = useState(false);

    const handleVincular = async () => {
        if (codigo.length < 6) return Alert.alert("Error", "El código debe tener 6 dígitos.");
        
        setLoading(true);
        try {
            // Simulamos un UUID (En producción usarías expo-crypto o similar)
            const fakeUuid = Math.random().toString(36).substring(2, 15);
            
            await pairingApi.consumePairingCode(codigo, fakeUuid, "Celular Protegido");
            
            setEstaVinculado(true);
            setCodigo(''); 
            Alert.alert("¡Éxito!", "El dispositivo ha sido vinculado correctamente al Backend.");
        } catch (error: any) {
            Alert.alert("Error de vinculación", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDesbloquear = async () => {
        // En una app real, acá llamarías al backend para desvincular
        await AsyncStorage.removeItem('@device_token');
        await AsyncStorage.removeItem('@device_uuid');
        navigation.replace('Login'); 
    };

    if (!estaVinculado) {
        return (
            <SafeAreaView style={styles.root}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.container}>
                    <Text style={styles.icon}>🔗</Text>
                    <Text style={styles.title}>Vincular Dispositivo</Text>
                    <Text style={styles.subtitle}>
                        Pedile al Responsable que ingrese el código generado en su panel.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="000000"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={codigo}
                        onChangeText={setCodigo}
                        textAlign="center"
                    />

                    <Pressable style={styles.button} onPress={handleVincular} disabled={loading}>
                        <Text style={styles.buttonText}>{loading ? "Validando..." : "Activar Protección"}</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Dispositivo Protegido</Text>
                <Text style={styles.subtitle}>
                    Este dispositivo ya está vinculado a la cuenta del responsable.
                </Text>

                <Pressable style={[styles.button, { backgroundColor: '#2E7D32', marginTop: 30 }]} onPress={handleDesbloquear}>
                    <Text style={styles.buttonText}>Desvincular (Simulado)</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    icon: { fontSize: 80, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10, textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30 },
    input: { width: '80%', height: 60, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 12, fontSize: 24, fontWeight: 'bold', letterSpacing: 8, marginBottom: 30 },
    button: { backgroundColor: '#1976D2', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, width: '80%', alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});