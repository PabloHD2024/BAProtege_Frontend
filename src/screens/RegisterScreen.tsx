import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View, Linking, TouchableOpacity, Text } from 'react-native';
import Button from '../components/Button';
import CheckOption from '../components/CheckOption';
import TextField from '../components/TextField';
import {
    FIGMA_COLORS,
    FigmaScreen,
    PageTitle,
    ScreenFooter,
} from '../components';
import { api } from '../services/api';
import type { AppScreenProps } from '../navigation/types';
import { notify } from '../utils/notify';

export default function RegisterScreen({ navigation }: AppScreenProps<'Register'>) {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const canContinue =
        name.trim().length > 0 &&
        surname.trim().length > 0 &&
        email.includes('@') &&
        password.length >= 8 &&
        accepted;

    const submit = async () => {
        if (!canContinue) return;
        try {
            setLoading(true);
            await api.register(name, surname, email, password);
            navigation.replace('ResponsibleMode');
        } catch (error: any) {
            // ESTO ES LO QUE DEBES MEJORAR:
            notify('Error de registro', error.message);
            // O si usas un estado para mostrar el error en pantalla:
            // setErrorMsg(error.message);
        } finally {
            setLoading(false);
        }
    };

    // URL del documento de términos y condiciones (configurable por entorno).
    // Si no está definida no se muestra un enlace falso.
    const termsUrl = process.env.EXPO_PUBLIC_TERMS_URL;
    const openTerms = () => {
        if (termsUrl) Linking.openURL(termsUrl).catch(() => {});
    };

    return (
        <FigmaScreen onBack={() => navigation.goBack()}>
            <PageTitle
                title="Creá tu cuenta"
                subtitle="Completá tus datos para empezar a proteger a tu familia."
            />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <TextField label="Nombre" value={name} onChangeText={setName} />
                <TextField label="Apellido" value={surname} onChangeText={setSurname} />
                <TextField
                    label="Correo electrónico"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextField
                    label="Contraseña"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />
                
                {/* Checkbox con enlace a términos */}
                <View style={styles.checkboxContainer}>
                    <CheckOption
                        label="" // Dejamos el label vacío en el componente original
                        value={accepted}
                        onChange={setAccepted}
                    />
                    <TouchableOpacity onPress={() => setAccepted(!accepted)} style={styles.textContainer}>
                        <Text style={styles.checkboxText}>
                            Acepto los{' '}
                            {termsUrl ? (
                                <Text style={styles.link} onPress={openTerms}>
                                    términos y condiciones
                                </Text>
                            ) : (
                                'términos y condiciones'
                            )}
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            
            <ScreenFooter>
                <Button
                    label={loading ? 'Creando cuenta...' : 'Confirmar'}
                    disabled={!canContinue || loading}
                    onPress={submit}
                />
                <View style={styles.spacer} />
                <Button
                    label="Cancelar"
                    variant="outline"
                    onPress={() => navigation.goBack()}
                />
            </ScreenFooter>
        </FigmaScreen>
    );
}

const styles = StyleSheet.create({
    spacer: { height: 10 },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    textContainer: {
        flex: 1,
        marginLeft: 8,
    },
    checkboxText: {
        fontSize: 14,
        color: FIGMA_COLORS.text,
    },
    link: {
        color: FIGMA_COLORS.primary,
        textDecorationLine: 'underline',
    },
});