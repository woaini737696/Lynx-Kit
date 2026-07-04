import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react-native';

/**
 * WebView 预览页
 *
 * - 路由参数：url（远程地址）或 html（本地 HTML 片段）
 * - react-native-webview 渲染
 * - 顶部工具栏：刷新 + 在浏览器打开（返回按钮由 Stack 路由统一渲染）
 * - 加载状态指示器 + 错误处理
 */
export default function PreviewScreen() {
  const { url, html } = useLocalSearchParams<{ url?: string; html?: string }>();
  const urlVal = Array.isArray(url) ? url[0] : url;
  const htmlVal = Array.isArray(html) ? html[0] : html;
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  // 通过 key 变化触发 WebView 重新挂载实现「刷新」
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // 无有效预览内容时直接进入错误态
  useEffect(() => {
    if (!urlVal && !htmlVal) {
      setError(true);
      setLoading(false);
    }
  }, [urlVal, htmlVal]);

  const reload = () => {
    setLoading(true);
    setError(false);
    setReloadKey((k) => k + 1);
  };

  const openInBrowser = async () => {
    if (!urlVal) return;
    try {
      await Linking.openURL(urlVal);
    } catch {
      // 打开失败忽略
    }
  };

  const source = htmlVal ? { html: htmlVal } : urlVal ? { uri: urlVal } : null;
  const webViewBg = isDark ? '#09090B' : '#FFFFFF';

  return (
    <SafeAreaView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      edges={['bottom']}
    >
      {/* 顶部工具栏：毛玻璃 + 刷新 + 在浏览器打开 */}
      <View className="flex-row items-center gap-2 border-b border-ink-200/60 bg-white/70 px-3 py-2.5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
        <Text
          className="flex-1 text-sm text-ink-700 dark:text-ink-300"
          numberOfLines={1}
        >
          {urlVal ?? '本地预览'}
        </Text>
        <Pressable
          onPress={reload}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-950 active:opacity-80 dark:bg-ink-100"
          hitSlop={8}
        >
          <RefreshCw size={16} color={emphasisIcon} />
        </Pressable>
        <Pressable
          onPress={openInBrowser}
          disabled={!urlVal}
          className="h-9 w-9 items-center justify-center rounded-full bg-ink-950 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
          hitSlop={8}
        >
          <ExternalLink size={16} color={emphasisIcon} />
        </Pressable>
      </View>

      {/* WebView 区域 */}
      <View className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle size={28} color="#EF4444" />
            </View>
            <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
              无法加载预览
            </Text>
            <Text className="text-center text-sm text-ink-500 dark:text-ink-400">
              {urlVal ? '请尝试在浏览器中打开查看' : '未提供有效的预览地址'}
            </Text>
            {urlVal ? (
              <Pressable
                onPress={openInBrowser}
                className="mt-2 rounded-full bg-ink-950 px-5 py-2.5 active:opacity-80 dark:bg-ink-100"
              >
                <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
                  在浏览器打开
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : source ? (
          <>
            <WebView
              key={reloadKey}
              source={source}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
              style={{ backgroundColor: webViewBg }}
            />
            {loading ? (
              <View className="absolute inset-0 items-center justify-center bg-ink-100 dark:bg-ink-950">
                <ActivityIndicator color="#09090B" />
                <Text className="mt-3 text-xs text-ink-500 dark:text-ink-400">
                  加载中…
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
