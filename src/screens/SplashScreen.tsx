import React, { useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- IMPORTANTE: Importamos AsyncStorage
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';

export default function SplashScreen({ navigation }: AppScreenProps<'Splash'>) {
    useEffect(() => {
        // 1. Hacemos que la función del temporizador sea asíncrona
        const checkRoleAndNavigate = async () => {
            try {
                // 2. Leemos si el celular está en modo protegido
                const role = await AsyncStorage.getItem('@app_role');
                
                // 3. Evaluamos a dónde ir
                if (role === 'protected') {
                    navigation.replace('ProtectedHome'); // Va directo a la pantalla bloqueada
                } else {
                    navigation.replace('Onboarding', { step: 1 }); // Flujo normal
                }
            } catch (error) {
                // Si hay un error leyendo el storage, lo mandamos al flujo normal
                navigation.replace('Onboarding', { step: 1 });
            }
        };

        // ⏱️ Mantenemos los 4 segundos de espera
        const timer = setTimeout(() => {
            checkRoleAndNavigate();
        }, 4000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.body}>
                <Image 
                    source={require('../../assets/LogoBAProtege.png')} 
                    style={{ width: 176, height: 176, resizeMode: 'contain' }} 
                />
                <Image 
                    source={require('../../assets/logo blanco lotba.png')} 
                    style={{ width: 176, height: 176, resizeMode: 'contain' }} 
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        backgroundColor: FIGMA_COLORS.primary,
        flex: 1,
    },
    body: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    brand: {
        color: FIGMA_COLORS.surface,
        fontSize: 26,
        fontWeight: '700',
        marginTop: 16,
    },
});