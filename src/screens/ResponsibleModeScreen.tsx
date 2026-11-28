import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ban, LayoutDashboard, Link2 } from 'lucide-react-native';
import ActionTile from '../components/ActionTile';
import ResponsibleTabs from '../components/ResponsibleTabs';
import { FigmaScreen, FIGMA_COLORS } from '../components';
import type { AppScreenProps } from '../navigation/types';

export default function ResponsibleModeScreen({
                                                  navigation,
                                              }: AppScreenProps<'ResponsibleMode'>) {
    return (
        <FigmaScreen
            footer={<ResponsibleTabs active="home" navigation={navigation} />}
        >
            <Text style={styles.title}>Modo Responsable</Text>
            <ActionTile
                icon={<Ban size={20} />}
                title="Bloquear Sitios"
                subtitle="Bloqueá sitios incluidos en la lista de bloqueo."
                tone="primary"
                variant="card"
                onPress={() => navigation.navigate('BlockedSites')}
            />
            <ActionTile
                icon={<Link2 size={20} />}
                title="Vincular Dispositivos"
                subtitle="Vinculá uno o más dispositivos para protegerlos."
                tone="positive"
                variant="card"
                onPress={() => navigation.navigate('ConfigureAccess')}
            />
            <ActionTile
                icon={<LayoutDashboard size={20} />}
                title="Resumen de protección"
                subtitle="Consultá tus dispositivos, reglas y listas de bloqueo."
                tone="primary"
                variant="card"
                onPress={() => navigation.navigate('Settings')}
            />
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    title: {
        color: FIGMA_COLORS.text,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
    },
});