import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles } from 'lucide-react-native';

const EXAMPLES = [
  'AI 交友匹配小程序',
  '在线教育管理后台',
  '数据可视化 BI 仪表盘',
  'AI 内容创作工作站',
];

interface InspirationInputProps {
  onCreate: (text: string) => void;
  loading?: boolean;
}

/** 简化版灵感输入框 —— 移动端构建入口 */
export function InspirationInput({ onCreate, loading }: InspirationInputProps) {
  const [text, setText] = useState('');

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
        placeholder="描述你想构建的产品……例如：AI 交友匹配小程序"
        placeholderTextColor="#94A3B8"
        multiline
        numberOfLines={4}
        textAlignVertical="top"
        className="min-h-[120px] rounded-2xl bg-slate-800 px-4 py-3 text-base text-slate-100"
      />
      <View className="flex-row flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => {
              Haptics.selectionAsync();
              setText(ex);
            }}
            className="rounded-full bg-slate-700 px-3 py-1.5"
          >
            <Text className="text-xs text-slate-300">{ex}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={handleSubmit}
        disabled={!text.trim() || loading}
        className="flex-row items-center justify-center gap-2 rounded-2xl bg-lynx-500 px-4 py-4 active:opacity-80 disabled:opacity-40"
      >
        <Sparkles size={18} color="#FFFFFF" />
        <Text className="text-base font-semibold text-white">
          {loading ? '创建中…' : '开始构建'}
        </Text>
      </Pressable>
    </View>
  );
}
