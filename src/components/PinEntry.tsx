import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { FIGMA_COLORS } from './FigmaScreen';

type PinEntryProps = {
    value: string;
    onChangeText: (value: string) => void;
    length?: number;
    /** Muestra un círculo en lugar de cada dígito. */
    masked?: boolean;
    /**
     * Solo con `masked`: el último dígito escrito se ve este tiempo (ms) antes de pasar a
     * círculo, como en los campos de contraseña del celular. 0 = se oculta de inmediato.
     * Por defecto 700, así todos los campos de código ocultos se comportan igual.
     */
    revealDelayMs?: number;
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
                                     revealDelayMs = 700,
                                     accessibilityLabel,
                                     autoFocus = false,
                                     onSubmitEditing,
                                 }: PinEntryProps) {
    // Índice del dígito recién escrito que todavía se muestra (null = todos ocultos)
    const [revealedIndex, setRevealedIndex] = useState<number | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(
        () => () => {
            if (timer.current) clearTimeout(timer.current);
        },
        []
    );

    const handleChange = (text: string) => {
        const next = text.replace(/\D/g, '').slice(0, length);
        if (timer.current) clearTimeout(timer.current);

        // Solo se revela al escribir de a un dígito; al borrar o pegar todo queda oculto.
        // Se decide acá (y no en un efecto) para que no haya un cuadro con el círculo antes del número.
        if (masked && revealDelayMs > 0 && next.length === value.length + 1) {
            setRevealedIndex(next.length - 1);
            timer.current = setTimeout(() => setRevealedIndex(null), revealDelayMs);
        } else {
            setRevealedIndex(null);
        }
        onChangeText(next);
    };

    return (
        // El input oculto cubre las casillas: tocarlas lo enfoca. No se usa un <button> de
        // envoltorio porque en Firefox un campo dentro de un botón no recibe foco ni texto.
        <View style={styles.wrap}>
            <View style={styles.row}>
                {Array.from({ length }, (_, index) => (
                    <View key={index} style={styles.cell}>
                        {value[index] && masked && revealedIndex !== index ? (
                            <View style={styles.dot} />
                        ) : (
                            <Text style={styles.digit}>{value[index] ?? ''}</Text>
                        )}
                    </View>
                ))}
            </View>
            <TextInput
                accessibilityLabel={accessibilityLabel}
                autoComplete="off"
                autoFocus={autoFocus}
                keyboardType="number-pad"
                maxLength={length}
                onChangeText={handleChange}
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
    dot: {
        backgroundColor: FIGMA_COLORS.text,
        borderRadius: 7,
        height: 14,
        width: 14,
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