import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useChatStore } from '../store/useChatStore';
import { ChatMessage, ActionCard } from '../services/chatService';
import { Theme } from '../theme';

// ─── Quick suggestion chips shown before first message ─────────────────────────
const SUGGESTIONS = [
  'How can I improve my productivity?',
  'Give me a motivational tip',
  'What habits should I build?',
  'Help me plan my day',
  'How do I manage stress better?',
];

// ─── Typing dots indicator ─────────────────────────────────────────────────────
function TypingIndicator({ theme }: { theme: Theme }) {
  return (
    <View style={[bubbleStyles.row, { justifyContent: 'flex-start', marginBottom: 8 }]}>
      <View style={bubbleStyles.avatarContainer}>
        <Text style={bubbleStyles.avatarText}>🤖</Text>
      </View>
      <View
        style={[
          bubbleStyles.bubble,
          bubbleStyles.assistantBubble,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[bubbleStyles.typingText, { color: theme.colors.textMuted }]}>
          typing...
        </Text>
      </View>
    </View>
  );
}

// ─── Action cards rendered below assistant message ─────────────────────────────
function ActionCards({
  actions,
  theme,
}: {
  actions: ActionCard[];
  theme: Theme;
}) {
  if (actions.length === 0) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 6 }}
      contentContainerStyle={{ gap: 6, paddingRight: 8 }}
    >
      {actions.map((card, i) => (
        <TouchableOpacity
          key={i}
          style={[
            actionStyles.card,
            { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryLight ?? theme.colors.surface },
          ]}
          activeOpacity={0.75}
        >
          <Text style={[actionStyles.label, { color: theme.colors.primary }]}>{card.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const actionStyles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: { fontSize: 12, fontWeight: '600' },
});

// ─── Single message bubble ─────────────────────────────────────────────────────
function MessageBubble({ message, theme }: { message: ChatMessage; theme: Theme }) {
  const isUser = message.role === 'user';

  return (
    <View
      style={[
        bubbleStyles.row,
        isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' },
        { marginBottom: 10 },
      ]}
    >
      {!isUser && (
        <View style={bubbleStyles.avatarContainer}>
          <Text style={bubbleStyles.avatarText}>🤖</Text>
        </View>
      )}

      <View style={[bubbleStyles.bubbleWrapper, isUser && bubbleStyles.userWrapper]}>
        <View
          style={[
            bubbleStyles.bubble,
            isUser
              ? [bubbleStyles.userBubble, { backgroundColor: theme.colors.primary }]
              : [
                  bubbleStyles.assistantBubble,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ],
          ]}
        >
          <Text
            style={[
              bubbleStyles.content,
              { color: isUser ? '#fff' : theme.colors.text },
            ]}
          >
            {message.content}
          </Text>
        </View>

        {!isUser && message.actions && message.actions.length > 0 && (
          <ActionCards actions={message.actions} theme={theme} />
        )}

        <Text
          style={[
            bubbleStyles.timestamp,
            { color: theme.colors.textMuted, textAlign: isUser ? 'right' : 'left' },
          ]}
        >
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );
}

const bubbleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12 },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginBottom: 2,
  },
  avatarText: { fontSize: 18 },
  bubbleWrapper: { maxWidth: '78%' },
  userWrapper: { alignItems: 'flex-end' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: 'transparent' },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4 },
  content: { fontSize: 14, lineHeight: 20 },
  typingText: { fontSize: 14, fontStyle: 'italic' },
  timestamp: { fontSize: 10, marginTop: 3, paddingHorizontal: 4 },
});

// ─── Main ChatScreen ───────────────────────────────────────────────────────────
export function ChatScreen() {
  const { theme } = useAppStore();
  const { messages, isLoading, isTyping, error, fetchHistory, sendMessage, clearHistory } = useChatStore();
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length, isTyping]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isTyping) return;
    setInputText('');
    await sendMessage(text);
  }, [inputText, isTyping, sendMessage]);

  const handleSuggestion = useCallback(
    (text: string) => {
      setInputText(text);
    },
    [],
  );

  const handleClear = useCallback(() => {
    Alert.alert(
      'Clear Chat',
      'Delete all conversation history?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => clearHistory() },
      ],
    );
  }, [clearHistory]);

  const showSuggestions = messages.length === 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerEmoji}>🤖</Text>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>LifeFlow AI</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
              {isTyping ? 'Thinking...' : 'Your personal assistant'}
            </Text>
          </View>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={[styles.clearText, { color: theme.colors.error }]}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message list */}
      {isLoading && messages.length === 0 ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} theme={theme} />}
          contentContainerStyle={[
            styles.listContent,
            showSuggestions && styles.listContentEmpty,
          ]}
          ListHeaderComponent={
            showSuggestions ? (
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeEmoji}>🤖</Text>
                <Text style={[styles.welcomeTitle, { color: theme.colors.text }]}>
                  Hi! I'm LifeFlow AI
                </Text>
                <Text style={[styles.welcomeSubtitle, { color: theme.colors.textMuted }]}>
                  Ask me anything about productivity, wellness, or your goals.
                </Text>
                <View style={styles.suggestionsGrid}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.suggestionChip,
                        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                      ]}
                      onPress={() => handleSuggestion(s)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListFooterComponent={
            isTyping ? <TypingIndicator theme={theme} /> : null
          }
        />
      )}

      {/* Error banner */}
      {error && (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.errorLight ?? theme.colors.error + '22' }]}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
        </View>
      )}

      {/* Input bar */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            {
              backgroundColor: theme.colors.inputBackground,
              borderColor: theme.colors.inputBorder,
              color: theme.colors.text,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask me anything..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              backgroundColor: inputText.trim() && !isTyping ? theme.colors.primary : theme.colors.border,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji: { fontSize: 28 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSubtitle: { fontSize: 12, marginTop: 1 },
  clearBtn: { padding: 6 },
  clearText: { fontSize: 13, fontWeight: '600' },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingTop: 16, paddingBottom: 8 },
  listContentEmpty: { flex: 1 },

  welcomeContainer: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 8 },
  welcomeEmoji: { fontSize: 52, marginBottom: 4 },
  welcomeTitle: { fontSize: 20, fontWeight: '700' },
  welcomeSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  suggestionsGrid: { width: '100%', marginTop: 12, gap: 8 },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: { fontSize: 13 },

  errorBanner: { marginHorizontal: 12, marginBottom: 4, padding: 10, borderRadius: 8 },
  errorText: { fontSize: 12, textAlign: 'center' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 110,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
});
