import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoleSelectionScreen({ navigation }: AppScreenProps<'RoleSelection'>) {
    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.title}>¿Cómo vas a usar la app?</Text>
                <Text style={styles.subtitle}>
                    Elegí tu rol para continuar. Esta configuración es importante.
                </Text>

                <View style={styles.cardsContainer}>
                    {/* BOTÓN RESPONSABLE (AZUL) */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#1976D2' }]}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cardIcon}>🛡️</Text>
                        <Text style={styles.cardTitle}>Soy Responsable</Text>
                        <Text style={styles.cardDescription}>
                            Administrá la protección y gestioná los dispositivos.
                        </Text>
                    </TouchableOpacity>

                    {/* BOTÓN PROTEGIDO (VERDE) */}
                    <TouchableOpacity
                        style={[styles.card, { backgroundColor: '#2E7D32' }]}
                        onPress={async () => {
                            // 1. Guardamos el rol como 'protected'
                            await AsyncStorage.setItem('@app_role', 'protected');
                            // 2. Lo mandamos a la pantalla
                            navigation.replace('ProtectedHome');
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.cardIcon}>📱</Text>
                        <Text style={styles.cardTitle}>Soy Protegido</Text>
                        <Text style={styles.cardDescription}>
                            Este dispositivo está protegido. Solo el responsable puede desbloquearlo.
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: FIGMA_COLORS.background },
    container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: '800', color: FIGMA_COLORS.text, textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 16, color: FIGMA_COLORS.text, textAlign: 'center', marginBottom: 40, opacity: 0.7 },
    cardsContainer: { gap: 20 },
    card: { borderRadius: 16, padding: 24, alignItems: 'center', elevation: 5 },
    cardIcon: { fontSize: 48, marginBottom: 12 },
    cardTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: 8 },
    cardDescription: { fontSize: 14, color: '#E0E0E0', textAlign: 'center' },
});