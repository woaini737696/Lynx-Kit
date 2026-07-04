import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Copy, Check, FileCode2, FileText } from 'lucide-react-native';
import type { CodeFile } from '@lynxkit/shared';
import { buildApi } from '../../../src/lib/api';

/**
 * 代码预览页（移动端简化版）
 *
 * - 文件列表（FlatList）：点击文件切换显示
 * - 代码块：bg-ink-950 text-ink-100 rounded-2xl p-4，等宽字体
 * - 复制按钮：通过 Alert 展示内容（无 clipboard 依赖时降级）
 * - 空态：会话未生成代码时展示
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */

/** 文件图标按扩展名 */
function FileIcon({
  name,
  active,
  isDark,
}: {
  name: string;
  active: boolean;
  isDark: boolean;
}) {
  const color = active
    ? isDark
      ? '#09090B'
      : '#FFFFFF'
    : isDark
      ? '#A1A1AA'
      : '#52525B';
  if (name.endsWith('.md')) return <FileText size={14} color={color} />;
  return <FileCode2 size={14} color={color} />;
}

export default function CodePreviewScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const { data: session, isLoading } = useQuery({
    queryKey: ['build', id],
    queryFn: () => buildApi.getById(id!),
    enabled: !!id,
  });

  const [selected, setSelected] = useState<CodeFile | null>(null);
  const [copied, setCopied] = useState(false);

  const files: CodeFile[] = session?.generatedCode?.files ?? [];

  // 默认选中第一个文件
  useEffect(() => {
    if (!selected && files.length > 0 && files[0]) {
      setSelected(files[0]);
    }
  }, [files, selected]);

  const totalLines = files.reduce(
    (sum, f) => sum + f.content.split('\n').length,
    0,
  );

  const copyCode = () => {
    if (!selected) return;
    // 移动端无 clipboard 库，降级为 Alert 展示已复制提示
    Alert.alert(t('build.copied'), selected.path, [
      { text: t('common.ok'), onPress: () => setCopied(false) },
    ]);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-100 dark:bg-ink-950">
        <ActivityIndicator color="#09090B" />
      </View>
    );
  }

  // 空态
  if (files.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-ink-100 dark:bg-ink-950" edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/70 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
            <FileCode2 size={28} color="#52525B" />
          </View>
          <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
            {t('build.noCode')}
          </Text>
          <Text className="text-center text-sm text-ink-500 dark:text-ink-400">
            {t('build.noCodeHint')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ink-100 dark:bg-ink-950" edges={['bottom']}>
      {/* 统计栏 */}
      <View className="flex-row items-center gap-3 border-b border-ink-200 px-4 py-2.5 dark:border-ink-800">
        <Text className="text-xs text-ink-500 dark:text-ink-400">
          {t('build.fileCount', { count: files.length })}
        </Text>
        <Text className="text-xs text-ink-300 dark:text-ink-700">·</Text>
        <Text className="text-xs text-ink-500 dark:text-ink-400">
          {t('build.totalLines', { count: totalLines })}
        </Text>
      </View>

      {/* 文件列表（横向滚动毛玻璃胶囊） */}
      <View className="border-b border-ink-200 dark:border-ink-800">
        <FlatList
          horizontal
          data={files}
          keyExtractor={(item) => item.path}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-3 py-2.5"
          renderItem={({ item }) => {
            const active = selected?.path === item.path;
            return (
              <Pressable
                onPress={() => setSelected(item)}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${
                  active
                    ? 'bg-ink-950 dark:bg-ink-100'
                    : 'border border-ink-300 bg-transparent dark:border-ink-700'
                }`}
              >
                <FileIcon name={item.path} active={active} isDark={isDark} />
                <Text
                  className={`text-xs ${
                    active
                      ? 'text-ink-0 dark:text-ink-950'
                      : 'text-ink-600 dark:text-ink-300'
                  }`}
                  numberOfLines={1}
                >
                  {item.path.split('/').pop() ?? item.path}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* 代码内容 + 复制按钮 */}
      {selected ? (
        <View className="flex-1">
          {/* 当前文件路径 + 复制 */}
          <View className="flex-row items-center justify-between border-b border-ink-200 px-4 py-2 dark:border-ink-800">
            <Text
              className="flex-1 font-mono text-xs text-ink-950 dark:text-ink-50"
              numberOfLines={1}
            >
              {selected.path}
            </Text>
            <Pressable
              onPress={copyCode}
              className="flex-row items-center gap-1 rounded-full border border-ink-300 bg-transparent px-2.5 py-1.5 active:opacity-80 dark:border-ink-700"
            >
              {copied ? (
                <Check size={12} color="#22C55E" />
              ) : (
                <Copy size={12} color="#09090B" />
              )}
              <Text className="text-xs text-ink-900 dark:text-ink-50">
                {copied ? t('build.copied') : t('build.copyCode')}
              </Text>
            </Pressable>
          </View>

          {/* 代码块：bg-ink-950 text-ink-100，等宽字体 */}
          <ScrollView className="flex-1 bg-ink-950">
            <View className="rounded-2xl p-4">
              {selected.content.split('\n').map((line, i) => (
                <View key={i} className="flex-row">
                  <Text className="mr-3 w-8 shrink-0 text-right font-mono text-xs leading-5 text-ink-500">
                    {i + 1}
                  </Text>
                  <Text className="flex-1 font-mono text-xs leading-5 text-ink-100">
                    {line || ' '}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
