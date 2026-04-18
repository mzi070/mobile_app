import React from 'react';
import {
  TextInput as RNTextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps as RNTextInputProps,
  ViewStyle,
} from 'react-native';
import { useAppStore } from '../store';

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  error,
  containerStyle,
  style,
  ...props
}: TextInputProps) {
  const { theme } = useAppStore();

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.textSecondary, marginBottom: 6 },
          ]}
        >
          {label}
        </Text>
      )}
      <RNTextInput
        placeholderTextColor={theme.colors.textTertiary}
        accessibilityLabel={label}
        style={[
          styles.input,
          theme.typography.body,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error ? theme.colors.error : theme.colors.inputBorder,
            color: theme.colors.textPrimary,
            borderRadius: theme.borderRadius.md,
          },
          style,
        ]}
        {...props}
      />
      {error && (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.error, marginTop: 4 },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
});
