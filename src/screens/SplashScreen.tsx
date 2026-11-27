import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';

export default function SplashScreen({ navigation }: AppScreenProps<'Splash'>) {
    // useRef evita que el temporizador se pierda si el componente se re-renderiza
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const checkRoleAndNavigate = async () => {
            try {
                // Agregamos un timeout a la lectura de AsyncStorage para que no se cuelgue en Web
                const role = await Promise.race([
                    AsyncStorage.getItem('@app_role'),
                    new Promise((resolve) => setTimeout(() => resolve(null), 1000))
                ]);
                
                if (isMounted.current) {
                    if (role === 'protected') {
                        navigation.replace('ProtectedHome'); 
                    } else {
                        navigation.replace('Onboarding', { step: 1 }); 
                    }
                }
            } catch (error) {
                console.warn("Error en Splash:", error);
                if (isMounted.current) {
                    navigation.replace('Onboarding', { step: 1 });
                }
            }
        };

        // Forzamos la ejecución a los 3 segundos
        const timer = setTimeout(() => {
            checkRoleAndNavigate();
        }, 3000);

        return () => {
            isMounted.current = false;
            clearTimeout(timer);
        };
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
});