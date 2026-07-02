import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
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

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['bottom']}>
      {/* 顶部工具栏：刷新 + 在浏览器打开 */}
      <View className="flex-row items-center gap-2 border-b border-slate-800 px-3 py-2.5">
        <Text className="flex-1 text-sm text-slate-200" numberOfLines={1}>
          {urlVal ?? '本地预览'}
        </Text>
        <Pressable
          onPress={reload}
          className="h-9 w-9 items-center justify-center rounded-lg active:bg-slate-800"
        >
          <RefreshCw size={18} color="#F8FAFC" />
        </Pressable>
        <Pressable
          onPress={openInBrowser}
          disabled={!urlVal}
          className="h-9 w-9 items-center justify-center rounded-lg active:bg-slate-800 disabled:opacity-40"
        >
          <ExternalLink size={18} color="#F8FAFC" />
        </Pressable>
      </View>

      {/* WebView 区域 */}
      <View className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <AlertTriangle size={32} color="#EF4444" />
            <Text className="text-base font-semibold text-slate-200">
              无法加载预览
            </Text>
            <Text className="text-center text-sm text-slate-400">
              {urlVal ? '请尝试在浏览器中打开查看' : '未提供有效的预览地址'}
            </Text>
            {urlVal ? (
              <Pressable
                onPress={openInBrowser}
                className="mt-2 rounded-full bg-lynx-500 px-5 py-2.5 active:opacity-80"
              >
                <Text className="text-sm font-semibold text-white">
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
              style={{ backgroundColor: '#0F172A' }}
            />
            {loading ? (
              <View className="absolute inset-0 items-center justify-center bg-slate-950">
                <ActivityIndicator color="#FF6B35" />
                <Text className="mt-3 text-xs text-slate-400">加载中…</Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
