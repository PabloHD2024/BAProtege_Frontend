import React from 'react';
import { StyleSheet, Text, View, Pressable, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppScreenProps } from '../navigation/types';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoleSelectionScreen({ navigation }: AppScreenProps<'RoleSelection'>) {
    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                <Text style={styles.pageTitle}>¿Cómo vas a usar la app?</Text>

                {/* BOTÓN RESPONSABLE (AZUL) */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.button, 
                        { backgroundColor: '#1976D2', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.buttonText}>Soy Responsable</Text>
                </Pressable>

                {/* BOTÓN PROTEGIDO (VERDE) */}
                <Pressable 
                    style={({ pressed }) => [
                        styles.button, 
                        { backgroundColor: '#2E7D32', opacity: pressed ? 0.8 : 1 }
                    ]}
                    onPress={async () => {
                        try {
                            await AsyncStorage.setItem('@app_role', 'protected');
                            navigation.replace('ProtectedHome'); 
                        } catch (error) {
                            console.log("Error:", error);
                        }
                    }}
                >
                    <Text style={styles.buttonText}>Soy Protegido</Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F5F7FA' },
    container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
    pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 40 },
    button: { borderRadius: 16, paddingVertical: 24, alignItems: 'center', marginBottom: 20 },
    buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});