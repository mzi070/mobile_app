import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { Button } from '../components';
import type { Theme } from '../theme';

export function LoginScreen() {
  const { theme, setAuth } = useAppStore();
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    // TODO: Replace with actual Auth0 login flow
    // For now, use a demo user to test navigation
    setAuth('demo-token', {
      id: 'demo-user',
      name: 'Alex Chen',
      email: 'alex@example.com',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
        },
      ]}
    >
      <View style={styles.topSection}>
        {/* Logo / Branding */}
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <Text style={styles.logoEmoji}>🌊</Text>
        </View>
        <Text
          style={[
            theme.typography.h1,
            { color: theme.colors.textPrimary, marginTop: 24 },
          ]}
        >
          LifeFlow
        </Text>
        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 12,
              paddingHorizontal: 40,
            },
          ]}
        >
          Your AI-powered personal assistant for productivity, wellness, and
          sustainable living.
        </Text>
      </View>

      {/* Features preview */}
      <View style={styles.features}>
        <FeatureRow emoji="🤖" text="AI assistant that knows your routine" theme={theme} />
        <FeatureRow emoji="📅" text="Tasks, calendar & habits in one place" theme={theme} />
        <FeatureRow emoji="🧘" text="Wellness tools for a balanced life" theme={theme} />
        <FeatureRow emoji="🔒" text="Privacy-first, your data stays yours" theme={theme} />
      </View>

      {/* Login buttons */}
      <View style={styles.bottomSection}>
        <Button
          title="Continue with Google"
          onPress={handleLogin}
          variant="primary"
          size="lg"
          style={{ width: '100%', marginBottom: 12 }}
        />
        <Button
          title="Continue with Apple"
          onPress={handleLogin}
          variant="outline"
          size="lg"
          style={{ width: '100%', marginBottom: 12 }}
        />
        <Button
          title="Sign in with Email"
          onPress={handleLogin}
          variant="ghost"
          size="md"
          style={{ width: '100%' }}
        />

        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              textAlign: 'center',
              marginTop: 20,
            },
          ]}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

function FeatureRow({
  emoji,
  text,
  theme,
}: {
  emoji: string;
  text: string;
  theme: Theme;
}) {
  return (
    <View style={styles.featureRow}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text
        style={[
          theme.typography.bodySmall,
          { color: theme.colors.textPrimary, marginLeft: 12, flex: 1 },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 48,
  },
  features: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  bottomSection: {
    alignItems: 'center',
  },
});
