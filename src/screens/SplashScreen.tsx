import React, { useEffect, useState } from 'react';
import { StyleSheet, View, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';

export default function SplashScreen({ navigation }: AppScreenProps<'Splash'>) {
    const [segundos, setSegundos] = useState(0);

    useEffect(() => {
        // 1. Este intervalo suma 1 segundo cada 1 segundo real
        const interval = setInterval(() => {
            setSegundos((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // 2. Cuando llega a 4 segundos (o los que quieras), ejecutamos la navegación
    useEffect(() => {
        if (segundos >= 3) {
            const navigateApp = async () => {
                try {
                    const role = await AsyncStorage.getItem('@app_role');
                    if (role === 'protected') {
                        navigation.replace('ProtectedHome');
                    } else {
                        navigation.replace('Onboarding', { step: 1 });
                    }
                } catch (error) {
                    // Si falla AsyncStorage en web, lo mandamos al Onboarding
                    navigation.replace('Onboarding', { step: 1 });
                }
            };
            navigateApp();
        }
    }, [segundos, navigation]);

    return (
        <SafeAreaView style={styles.root}>
            <StatusBar barStyle="light-content" />
            <View style={styles.body}>
                <Image 
                    source={require('../../assets/LogoBAProtege.png')} 
                    style={{ width: 220, height: 220, resizeMode: 'contain' }} 
                />
                <Image 
                    source={require('../../assets/logo blanco lotba.png')} 
                    style={{ width: 200, height: 200, resizeMode: 'contain' }} 
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