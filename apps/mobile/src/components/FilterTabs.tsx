import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme } from '../theme';

export interface FilterOption {
  label: string;
  value: string;
}

interface FilterTabsProps {
  options: FilterOption[];
  selected: string;
  onSelect: (value: string) => void;
  theme: Theme;
}

export function FilterTabs({ options, selected, onSelect, theme }: FilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((opt) => {
        const isActive = opt.value === selected;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[
              styles.tab,
              {
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.surface,
                borderColor: isActive
                  ? theme.colors.primary
                  : theme.colors.border,
              },
            ]}
            onPress={() => onSelect(opt.value)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? '#FFFFFF' : theme.colors.textSecondary,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
  },
});
