import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { notify } from '../utils/notify';

export default function ProtectedScreen({ navigation }: any) {
    const [pin, setPin] = useState('');

    const handleUnlock = async () => {
        // Acá validas el PIN con el backend o con el storage local
        if (pin === '123456') { 
            // Si el PIN es correcto (simulado), se desbloquea y vuelve al sistema
            // O le permite al tutor entrar a configurar algo temporalmente
            notify("Desbloqueado", "El dispositivo ha sido desbloqueado por el responsable.");
        } else {
            notify("Error", "PIN incorrecto. Pedile el código al responsable.");
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.icon}>🔒</Text>
                <Text style={styles.title}>Dispositivo Protegido</Text>
                <Text style={styles.subtitle}>
                    Las aplicaciones y sitios configurados están bloqueados.
                </Text>

                <Text style={styles.pinLabel}>Ingresá el código de 6 dígitos para desbloquear:</Text>

                {/* Aquí iría tu componente de inputs de 6 dígitos */}
                <View style={styles.pinContainer}>
                    {[...Array(6)].map((_, i) => (
                        <View key={i} style={styles.pinBox} />
                    ))}
                </View>

                <TouchableOpacity style={styles.button} onPress={handleUnlock}>
                    <Text style={styles.buttonText}>Desbloquear</Text>
                </TouchableOpacity>
            </View>

            {/* 
              ⚠️ IMPORTANTE: No pongas botones de "Volver", ni "Configuración", 
              ni "Cerrar sesión" acá. Si el protegido quiere salir, 
              tiene que ser cerrando la app o ingresando el PIN.
            */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    icon: { fontSize: 80, marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 10 },
    subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
    pinLabel: { fontSize: 16, color: '#333', marginBottom: 20 },
    pinContainer: { flexDirection: 'row', gap: 10, marginBottom: 40 },
    pinBox: { width: 40, height: 50, borderWidth: 2, borderColor: '#1976D2', borderRadius: 8, backgroundColor: '#FFF' },
    button: { backgroundColor: '#1976D2', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 8 },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});