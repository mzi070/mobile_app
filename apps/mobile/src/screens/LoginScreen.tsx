import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store';
import { Button } from '../components';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import type { Theme } from '../theme';

export function LoginScreen() {
  const { theme, setAuth } = useAppStore();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth0Login = async () => {
    setIsLoading(true);
    try {
      const { credentials, user } = await authService.login();
      await authService.saveCredentials(credentials);
      setAuth(credentials.accessToken, {
        id: user.sub,
        name: user.name,
        email: user.email,
        avatarUrl: user.picture,
      });
      // Set up notifications after login
      await notificationService.setup();
      const granted = await notificationService.requestPermission();
      if (granted) {
        await notificationService.scheduleDailyHabitReminder(20, 0);
        await notificationService.scheduleDailyMoodCheckIn(9, 0);
      }
    } catch (err: unknown) {
      // User cancelled login (error.code === 'a0.session.user_cancelled') — ignore silently
      const code = (err as { code?: string })?.code;
      if (code !== 'a0.session.user_cancelled') {
        Alert.alert(
          'Sign In Failed',
          err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Demo shortcut for development (no Auth0 credentials needed)
  const handleDemoLogin = () => {
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
        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginBottom: 24 }} />
        ) : (
          <>
            <Button
              title="Continue with Auth0"
              onPress={handleAuth0Login}
              variant="primary"
              size="lg"
              style={{ width: '100%', marginBottom: 12 }}
            />
            <Button
              title="Try Demo (No Account Needed)"
              onPress={handleDemoLogin}
              variant="outline"
              size="lg"
              style={{ width: '100%', marginBottom: 12 }}
            />
          </>
        )}

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
