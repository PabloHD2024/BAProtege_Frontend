import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- 1. IMPORTAR ACÁ
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen({ navigation }: AppScreenProps<'RoleSelection'>) {
    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.title}>¿Cómo vas a usar la app?</Text>

                <View style={styles.card}>
                    {/* BOTÓN RESPONSABLE (AZUL) */}
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: '#1976D2' }]}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <Text style={styles.title}>Soy Responsable</Text>
                    </TouchableOpacity>

                    {/* BOTÓN PROTEGIDO (VERDE) */}
                    <TouchableOpacity 
                        style={[styles.card, { backgroundColor: '#2E7D32' }]}
                        // 👇 2. ACÁ VA EL ASYNC STORAGE 👇
                        onPress={async () => {
                            await AsyncStorage.setItem('@app_role', 'protected');
                            navigation.replace('ProtectedHome'); 
                        }}
                    >
                        <Text style={styles.title}>Soy Protegido</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: FIGMA_COLORS.background || '#F5F7FA', // Fondo claro, igual al resto de la app
    },
    container: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        alignItems: 'center',
        backgroundColor: FIGMA_COLORS.primary,
        borderRadius: 20,
        marginBottom: 20,
        padding: 28,
    },
    title: {
        color: FIGMA_COLORS.surface,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 12,
    },
    caption: {
        color: FIGMA_COLORS.surface,
        fontSize: 13,
        lineHeight: 19,
        marginTop: 6,
        opacity: 0.9,
        textAlign: 'center',
    },
    spacer: { height: 10 },
});