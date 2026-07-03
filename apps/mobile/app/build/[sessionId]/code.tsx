import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
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
 * - 代码内容：ScrollView + Text，每行带行号，无语法高亮
 * - 复制按钮：通过 Alert 展示内容（无 clipboard 依赖时降级）
 * - 空态：会话未生成代码时展示
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */

/** 文件图标按扩展名 */
function FileIcon({ name }: { name: string }) {
  if (name.endsWith('.md')) return <FileText size={14} color="#38BDF8" />;
  return <FileCode2 size={14} color="#FF6B35" />;
}

export default function CodePreviewScreen() {
  const { t } = useTranslation();
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
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  // 空态
  if (files.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950" edges={['bottom']}>
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <FileCode2 size={28} color="#64748B" />
          </View>
          <Text className="text-base font-semibold text-slate-200">
            {t('build.noCode')}
          </Text>
          <Text className="text-center text-sm text-slate-400">
            {t('build.noCodeHint')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['bottom']}>
      {/* 统计栏 */}
      <View className="flex-row items-center gap-3 border-b border-slate-800 px-4 py-2.5">
        <Text className="text-xs text-slate-400">
          {t('build.fileCount', { count: files.length })}
        </Text>
        <Text className="text-xs text-slate-600">·</Text>
        <Text className="text-xs text-slate-400">
          {t('build.totalLines', { count: totalLines })}
        </Text>
      </View>

      {/* 文件列表（横向滚动卡片） */}
      <View className="border-b border-slate-800">
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
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${active ? 'bg-lynx-500' : 'bg-slate-800'}`}
              >
                <FileIcon name={item.path} />
                <Text
                  className={`text-xs ${active ? 'text-white' : 'text-slate-300'}`}
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
          <View className="flex-row items-center justify-between border-b border-slate-800 px-4 py-2">
            <Text
              className="flex-1 font-mono text-xs text-lynx-500"
              numberOfLines={1}
            >
              {selected.path}
            </Text>
            <Pressable
              onPress={copyCode}
              className="flex-row items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 active:opacity-80"
            >
              {copied ? (
                <Check size={12} color="#22C55E" />
              ) : (
                <Copy size={12} color="#F8FAFC" />
              )}
              <Text className="text-xs text-slate-200">
                {copied ? t('build.copied') : t('build.copyCode')}
              </Text>
            </Pressable>
          </View>

          {/* 代码内容：带行号 */}
          <ScrollView className="flex-1 bg-slate-950">
            <View className="px-3 py-3">
              {selected.content.split('\n').map((line, i) => (
                <View key={i} className="flex-row">
                  <Text className="mr-3 w-8 shrink-0 text-right font-mono text-xs leading-5 text-slate-600">
                    {i + 1}
                  </Text>
                  <Text className="flex-1 font-mono text-xs leading-5 text-slate-200">
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
