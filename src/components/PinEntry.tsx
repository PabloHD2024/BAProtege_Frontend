import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FIGMA_COLORS } from './FigmaScreen';

type PinEntryProps = {
    value: string;
    onChangeText: (value: string) => void;
    length?: number;
    masked?: boolean;
    accessibilityLabel: string;
    /** Enfoca el campo al montar la pantalla (abre el teclado numérico). */
    autoFocus?: boolean;
    /** Se dispara con Enter / "Listo" del teclado. */
    onSubmitEditing?: () => void;
};

export default function PinEntry({
                                     value,
                                     onChangeText,
                                     length = 6,
                                     masked = false,
                                     accessibilityLabel,
                                     autoFocus = false,
                                     onSubmitEditing,
                                 }: PinEntryProps) {
    return (
        // El input oculto cubre las casillas: tocarlas lo enfoca. No se usa un <button> de
        // envoltorio porque en Firefox un campo dentro de un botón no recibe foco ni texto.
        <View style={styles.wrap}>
            <View style={styles.row}>
                {Array.from({ length }, (_, index) => (
                    <View key={index} style={styles.cell}>
                        <Text style={styles.digit}>
                            {value[index] ? (masked ? '•' : value[index]) : ''}
                        </Text>
                    </View>
                ))}
            </View>
            <TextInput
                accessibilityLabel={accessibilityLabel}
                autoComplete="off"
                autoFocus={autoFocus}
                keyboardType="number-pad"
                maxLength={length}
                onChangeText={text => onChangeText(text.replace(/\D/g, '').slice(0, length))}
                onSubmitEditing={onSubmitEditing}
                style={styles.hiddenInput}
                textContentType="none"
                value={value}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignSelf: 'stretch',
        position: 'relative',
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        marginVertical: 10,
    },
    cell: {
        alignItems: 'center',
        backgroundColor: FIGMA_COLORS.softPurple,
        borderColor: FIGMA_COLORS.primary,
        borderRadius: 10,
        borderWidth: 1,
        height: 52,
        justifyContent: 'center',
        width: 48,
    },
    digit: {
        color: FIGMA_COLORS.primary,
        fontSize: 22,
        fontWeight: '700',
    },
    // Misma altura que las casillas y alineado con ellas (row tiene marginVertical: 10)
    hiddenInput: {
        color: 'transparent',
        height: 52,
        left: 0,
        opacity: 0.02,
        position: 'absolute',
        right: 0,
        top: 10,
    },
});