import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pairingApi } from '../services/api'; // Asegurate de que la ruta sea correcta
import type { AppScreenProps } from '../navigation/types';

export default function ConfigureAccessScreen({ navigation }: AppScreenProps<'ConfigureAccess'>) {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);

    const generarCodigo = async () => {
        setLoading(true);
        try {
            // Llamamos al Backend para que genere el PIN real
            const response = await pairingApi.generatePairingCode();
            setPin(response.code); // Guardamos el PIN devuelto (ej. "492015")
        } catch (error: any) {
            Alert.alert("Error", error.message || "No se pudo generar el código");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                
                {pin ? (
                    // Si ya tenemos el PIN, lo mostramos en grande
                    <View style={styles.pinContainer}>
                        <Text style={styles.title}>Código de Vinculación</Text>
                        <Text style={styles.pinText}>{pin}</Text>
                        <Text style={styles.pinExpiry}>Ingresá este código en el celular del protegido. Válido por 10 minutos.</Text>
                    </View>
                ) : (
                    // Si no hay PIN, mostramos el botón azul para generarlo
                    <Pressable 
                        style={[styles.button, loading && { opacity: 0.5 }]} 
                        onPress={generarCodigo} 
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? "Generando código..." : "Generar Código de Acceso"}
                        </Text>
                    </Pressable>
                )}

                <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 30 }}>
                    <Text style={styles.backText}>Volver</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 20 },
    pinContainer: { backgroundColor: '#E3F2FD', padding: 30, borderRadius: 16, alignItems: 'center', width: '100%' },
    pinText: { fontSize: 56, fontWeight: 'bold', letterSpacing: 12, color: '#1976D2', marginBottom: 10 },
    pinExpiry: { fontSize: 14, color: '#666', textAlign: 'center' },
    button: { backgroundColor: '#1976D2', paddingVertical: 16, paddingHorizontal: 40, borderRadius: 12, width: '100%', alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    backText: { color: '#666', fontSize: 16 }
});