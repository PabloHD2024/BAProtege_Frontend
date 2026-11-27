import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppScreenProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProtectedHomeScreen({ navigation }: AppScreenProps<'ProtectedHome'>) {
    const [codigo, setCodigo] = useState('');
    // false = Primera vez (Vinculación) | true = Ya vinculado (Bloqueado)
    const [estaVinculado, setEstaVinculado] = useState(false); 

    // --- ACCIÓN: EL RESPONSABLE VINCULA EL CELULAR (Primera vez) ---
    const handleVincular = async () => {
        if (codigo.length < 6) {
            Alert.alert("Error", "El código de vinculación debe tener 6 dígitos.");
            return;
        }
        
        // Simulamos que el código es correcto y vinculamos el celular
        await AsyncStorage.setItem('@device_linked', 'true');
        setEstaVinculado(true);
        setCodigo(''); // Limpiamos el input
        Alert.alert("¡Éxito!", "El dispositivo ha sido vinculado. Ahora está protegido.");
    };

    // --- ACCIÓN: EL RESPONSABLE DESBLOQUEA EL CELULAR ---
    const handleDesbloquear = async () => {
        if (codigo.length < 6) {
            Alert.alert("Error", "El PIN de desbloqueo debe tener 6 dígitos.");
            return;
        }

        // Simulamos que el PIN es correcto y desbloqueamos el celular
        await AsyncStorage.removeItem('@app_role'); // Borra el modo protegido
        await AsyncStorage.removeItem('@device_linked');
        navigation.replace('Login'); 
    };

    // --- VISTA 1: VINCULACIÓN (El celular no está protegido todavía) ---
    if (!estaVinculado) {
        return (
            <SafeAreaView style={styles.root}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.container}>
                    <Text style={styles.icon}>🔗</Text>
                    <Text style={styles.title}>Vincular Dispositivo</Text>
                    <Text style={styles.subtitle}>
                        Este dispositivo aún no está protegido. Pedile al Responsable que ingrese el código de activación de 6 dígitos.
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

                    <Pressable style={styles.button} onPress={handleVincular}>
                        <Text style={styles.buttonText}>Activar Protección</Text>
                    </Pressable>

                    <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                        <Text style={{ color: '#666', textAlign: 'center' }}>Volver atrás</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    // --- VISTA 2: BLOQUEADO (El celular ya está protegido) ---
    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Dispositivo Protegido</Text>
                <Text style={styles.subtitle}>
                    Las aplicaciones y sitios de apuestas están bloqueados en este dispositivo.
                </Text>

                <Text style={styles.pinLabel}>Para desbloquear, el Responsable debe ingresar el PIN:</Text>

                <TextInput
                    style={styles.input}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={codigo}
                    onChangeText={setCodigo}
                    textAlign="center"
                    secureTextEntry // Oculta los números para que parezcan puntos (como un PIN real)
                />

                <Pressable style={[styles.button, { backgroundColor: '#2E7D32' }]} onPress={handleDesbloquear}>
                    <Text style={styles.buttonText}>Desbloquear Dispositivo</Text>
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
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 22 },
    input: {
        width: '80%',
        height: 60,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 12,
        fontSize: 24,
        fontWeight: 'bold',
        letterSpacing: 8,
        marginBottom: 30,
    },
    pinLabel: { fontSize: 15, color: '#333', marginBottom: 15, textAlign: 'center' },
    button: { backgroundColor: '#1976D2', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, width: '80%', alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});