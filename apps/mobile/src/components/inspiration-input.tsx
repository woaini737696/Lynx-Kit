import { useState } from 'react';
import { Pressable, Text, TextInput, View, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

const EXAMPLE_KEYS = [
  'inspiration.example1',
  'inspiration.example2',
  'inspiration.example3',
  'inspiration.example4',
];

interface InspirationInputProps {
  onCreate: (text: string) => void;
  loading?: boolean;
}

/** 简化版灵感输入框 —— 毛玻璃输入 + 纯黑构建按钮 */
export function InspirationInput({ onCreate, loading }: InspirationInputProps) {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const [text, setText] = useState('');
  const examples = EXAMPLE_KEYS.map((key) => t(key));
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  const handleSubmit = () => {
    if (!text.trim() || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCreate(text.trim());
  };

  return (
    <View className="gap-3">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('inspiration.placeholder')}
        placeholderTextColor="#A1A1AA"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="min-h-[120px] rounded-xl border border-white/70 bg-white/55 px-4 py-3 text-base text-ink-900 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/55 dark:text-ink-50"
      />
      <View className="flex-row flex-wrap gap-2">
        {examples.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => {
              Haptics.selectionAsync();
              setText(ex);
            }}
            className="rounded-full border border-ink-300 bg-transparent px-3 py-1.5 active:opacity-80 dark:border-ink-700"
          >
            <Text className="text-xs text-ink-600 dark:text-ink-300">{ex}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim() || loading}
        className="flex-row items-center justify-center gap-2 rounded-full bg-ink-950 px-4 py-4 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
      >
        <Sparkles size={18} color={emphasisIcon} />
        <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
          {loading ? t('inspiration.creating') : t('inspiration.startBuild')}
        </Text>
      </Pressable>
    </View>
  );
}
