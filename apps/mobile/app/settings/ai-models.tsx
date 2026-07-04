import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import {
  getCloudProviders,
  getLocalProviders,
  type ProviderMeta,
} from '@lynxkit/shared';
import { aiApi } from '../../src/lib/api';
import * as Haptics from 'expo-haptics';
import { CheckCircle2, XCircle, Cpu, Monitor } from 'lucide-react-native';

const CLOUD_PROVIDERS = getCloudProviders();
const LOCAL_PROVIDERS = getLocalProviders();

export default function AiModelsScreen() {
  const isDark = useColorScheme() === 'dark';
  const sectionIcon = isDark ? '#09090B' : '#3F3F46';

  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { ok: boolean; latencyMs?: number; error?: string }>
  >({});

  const handleTest = async (provider: ProviderMeta) => {
    const apiKey = apiKeys[provider.id] ?? '';
    if (!apiKey) return;
    setTesting(provider.id);
    setResults((prev) => ({ ...prev, [provider.id]: { ok: false } }));
    try {
      const res = await aiApi.test({
        provider: provider.id,
        apiKey,
        apiBase: provider.apiBase,
        model: provider.defaultModel,
      });
      setResults((prev) => ({
        ...prev,
        [provider.id]: {
          ok: res.ok,
          latencyMs: res.latencyMs,
          error: res.error,
        },
      }));
      await Haptics.notificationAsync(
        res.ok
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    } catch (e) {
      setResults((prev) => ({
        ...prev,
        [provider.id]: {
          ok: false,
          error: e instanceof Error ? e.message : '测试失败',
        },
      }));
    } finally {
      setTesting(null);
    }
  };

  const handleSave = async (provider: ProviderMeta) => {
    const apiKey = apiKeys[provider.id] ?? '';
    if (!apiKey) return;
    try {
      await aiApi.save({
        provider: provider.id,
        apiKey,
        apiBase: provider.apiBase,
        model: provider.defaultModel,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      contentContainerClassName="px-4 py-4 gap-5"
    >
      {/* 云端模型区段标题 */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Cpu size={18} color={sectionIcon} />
          <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
            云端模型（{CLOUD_PROVIDERS.length} 大 Provider）
          </Text>
        </View>
        <Text className="text-xs text-ink-500 dark:text-ink-400">
          配置 API Key 后即可用于 9 层 Agent 构建
        </Text>
      </View>

      {/* 云端模型卡片：毛玻璃 */}
      {CLOUD_PROVIDERS.map((provider) => {
        const result = results[provider.id];
        const isTesting = testing === provider.id;
        return (
          <View
            key={provider.id}
            className="gap-3 rounded-3xl border border-ink-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70"
          >
            <View className="gap-0.5">
              <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
                {provider.name}
              </Text>
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                {provider.description}
              </Text>
            </View>
            <TextInput
              value={apiKeys[provider.id] ?? ''}
              onChangeText={(v) =>
                setApiKeys((prev) => ({ ...prev, [provider.id]: v }))
              }
              placeholder="输入 API Key"
              placeholderTextColor="#A1A1AA"
              secureTextEntry
              autoCapitalize="none"
              className="rounded-xl bg-ink-100 px-3 py-3 text-sm text-ink-900 dark:bg-ink-800 dark:text-ink-50"
            />
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => handleTest(provider)}
                disabled={isTesting || !apiKeys[provider.id]}
                className="rounded-full border border-ink-300 bg-transparent px-4 py-2 active:opacity-80 disabled:opacity-40 dark:border-ink-700"
              >
                <Text className="text-xs font-medium text-ink-950 dark:text-ink-50">
                  {isTesting ? '测试中…' : '测试连通性'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSave(provider)}
                disabled={!apiKeys[provider.id]}
                className="rounded-full bg-ink-950 px-4 py-2 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
              >
                <Text className="text-xs font-semibold text-ink-0 dark:text-ink-950">
                  保存
                </Text>
              </Pressable>
              {isTesting ? (
                <ActivityIndicator size="small" color="#09090B" />
              ) : result ? (
                <View className="flex-row items-center gap-1">
                  {result.ok ? (
                    <>
                      <CheckCircle2 size={14} color="#22C55E" />
                      <Text className="text-xs text-green-600 dark:text-green-400">
                        连通 {result.latencyMs ? `${result.latencyMs}ms` : ''}
                      </Text>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} color="#EF4444" />
                      <Text className="text-xs text-red-500" numberOfLines={1}>
                        {result.error ?? '失败'}
                      </Text>
                    </>
                  )}
                </View>
              ) : null}
            </View>
          </View>
        );
      })}

      {/* 本地模型区段标题 */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Monitor size={18} color={sectionIcon} />
          <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
            本地模型
          </Text>
        </View>
        {LOCAL_PROVIDERS.map((provider) => (
          <View
            key={provider.id}
            className="flex-row items-center justify-between rounded-3xl border border-ink-200/60 bg-white/70 px-4 py-3.5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70"
          >
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-medium text-ink-900 dark:text-ink-50">
                {provider.name}
              </Text>
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                {provider.apiBase}
              </Text>
            </View>
            <View className="rounded-full border border-ink-300 bg-transparent px-2.5 py-1 dark:border-ink-700">
              <Text className="text-xs text-ink-600 dark:text-ink-300">
                需桌面端
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
