import React from 'react';
import { LockKeyhole, Shield } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ActionTile from '../components/ActionTile';
import { FigmaScreen, PageTitle, FIGMA_COLORS } from '../components';
import { notify } from '../utils/notify';
import type { AppScreenProps } from '../navigation/types';

export default function RoleSelectionScreen({ navigation }: AppScreenProps<'RoleSelection'>) {
    const goProtected = async () => {
        try {
            await AsyncStorage.setItem('@app_role', 'protected');
            navigation.replace('ProtectedHome');
        } catch {
            notify('Error', 'No se pudo continuar. Intentá de nuevo.');
        }
    };

    return (
        <FigmaScreen>
            <PageTitle
                title="¿Cómo vas a usar la app?"
                subtitle="Elegí el modo para este dispositivo."
            />
            <ActionTile
                icon={<Shield color={FIGMA_COLORS.surface} size={22} />}
                title="Soy Responsable"
                subtitle="Iniciá sesión para gestionar la protección de tu familia."
                tone="primary"
                onPress={() => navigation.navigate('Login')}
            />
            <ActionTile
                icon={<LockKeyhole color={FIGMA_COLORS.surface} size={22} />}
                title="Soy Protegido"
                subtitle="Vinculá este dispositivo con el código de tu responsable."
                tone="positive"
                onPress={goProtected}
            />
        </FigmaScreen>
    );
}
