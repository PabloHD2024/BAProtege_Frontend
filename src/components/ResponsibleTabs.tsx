import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomTabs, { type BottomTabKey } from './BottomTabs';
import type { RootStackParamList } from '../navigation/types';

type ResponsibleTabsProps = {
    active: BottomTabKey;
    navigation: NativeStackNavigationProp<RootStackParamList, any>;
};

/**
 * Barra inferior del responsable (Home / Historial / Perfil).
 * Concentra las reglas de navegación para que las tres pantallas se comporten igual:
 *  - Tocar la pestaña activa no hace nada.
 *  - Desde el Home, Historial y Perfil se apilan: "volver" regresa al Home.
 *  - Entre Historial y Perfil se reemplaza la pantalla, para no acumular pantallas.
 *  - Home desde otra pestaña reinicia la pila en el panel. En React Navigation 7,
 *    navigate() a una pantalla que ya está en la pila apila una copia en vez de volver.
 */
export default function ResponsibleTabs({ active, navigation }: ResponsibleTabsProps) {
    const go = (target: BottomTabKey) => {
        if (target === active) return;

        if (target === 'home') {
            navigation.reset({ index: 0, routes: [{ name: 'ResponsibleMode' }] });
            return;
        }
        const screen = target === 'history' ? 'History' : 'Profile';
        if (active === 'home') navigation.navigate(screen);
        else navigation.replace(screen);
    };

    return (
        <BottomTabs
            active={active}
            onHome={() => go('home')}
            onHistory={() => go('history')}
            onProfile={() => go('profile')}
        />
    );
}
