import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
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
      className="flex-1 bg-slate-950"
      contentContainerClassName="px-4 py-4 gap-5"
    >
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Cpu size={18} color="#FF6B35" />
          <Text className="text-base font-semibold text-slate-200">
            云端模型（{CLOUD_PROVIDERS.length} 大 Provider）
          </Text>
        </View>
        <Text className="text-xs text-slate-400">
          配置 API Key 后即可用于 9 层 Agent 构建
        </Text>
      </View>

      {CLOUD_PROVIDERS.map((provider) => {
        const result = results[provider.id];
        const isTesting = testing === provider.id;
        return (
          <View key={provider.id} className="gap-2.5 rounded-2xl bg-slate-800 p-4">
            <View className="gap-0.5">
              <Text className="text-base font-semibold text-slate-100">
                {provider.name}
              </Text>
              <Text className="text-xs text-slate-400">
                {provider.description}
              </Text>
            </View>
            <TextInput
              value={apiKeys[provider.id] ?? ''}
              onChangeText={(v) =>
                setApiKeys((prev) => ({ ...prev, [provider.id]: v }))
              }
              placeholder="输入 API Key"
              placeholderTextColor="#64748B"
              secureTextEntry
              autoCapitalize="none"
              className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-100"
            />
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => handleTest(provider)}
                disabled={isTesting || !apiKeys[provider.id]}
                className="rounded-lg bg-slate-700 px-3 py-2 active:opacity-80 disabled:opacity-40"
              >
                <Text className="text-xs font-medium text-slate-200">
                  {isTesting ? '测试中…' : '测试连通性'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => handleSave(provider)}
                disabled={!apiKeys[provider.id]}
                className="rounded-lg bg-lynx-500 px-3 py-2 active:opacity-80 disabled:opacity-40"
              >
                <Text className="text-xs font-medium text-white">保存</Text>
              </Pressable>
              {isTesting ? (
                <ActivityIndicator size="small" color="#FF6B35" />
              ) : result ? (
                <View className="flex-row items-center gap-1">
                  {result.ok ? (
                    <>
                      <CheckCircle2 size={14} color="#22C55E" />
                      <Text className="text-xs text-green-500">
                        连通 {result.latencyMs ? `${result.latencyMs}ms` : ''}
                      </Text>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} color="#EF4444" />
                      <Text className="text-xs text-red-400" numberOfLines={1}>
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

      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <Monitor size={18} color="#64748B" />
          <Text className="text-base font-semibold text-slate-200">本地模型</Text>
        </View>
        {LOCAL_PROVIDERS.map((provider) => (
          <View
            key={provider.id}
            className="flex-row items-center justify-between rounded-2xl bg-slate-800/60 px-4 py-3"
          >
            <View className="flex-1 gap-0.5">
              <Text className="text-sm font-medium text-slate-200">
                {provider.name}
              </Text>
              <Text className="text-xs text-slate-400">
                {provider.apiBase}
              </Text>
            </View>
            <View className="rounded-full bg-slate-700 px-2.5 py-1">
              <Text className="text-xs text-slate-400">需桌面端</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
