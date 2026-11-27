import React, { useEffect } from 'react';
import { StyleSheet, Text, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';

export default function SplashScreen({ navigation }: AppScreenProps<'Splash'>) {
    useEffect(() => {
        const checkRoleAndNavigate = async () => {
            try {
                // Creamos una promesa que lee el storage
                const storagePromise = AsyncStorage.getItem('@app_role');
                
                // Si el storage tarda más de 1.5 segundos, devolvemos null (timeout)
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
                
                const role = await Promise.race([storagePromise, timeoutPromise]);
                
                if (role === 'protected') {
                    navigation.replace('ProtectedHome'); 
                } else {
                    navigation.replace('Onboarding', { step: 1 }); 
                }
            } catch (error) {
                console.warn("Error leyendo AsyncStorage en Splash:", error);
                // Si hay error, siempre mandamos al Onboarding para no trabar la app
                navigation.replace('Onboarding', { step: 1 });
            }
        };

        const timer = setTimeout(() => {
            checkRoleAndNavigate();
        }, 3000); // 3 segundos de Splash (podés dejarlo en 4 si querés)

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
});