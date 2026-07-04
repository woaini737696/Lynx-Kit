import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Save, Lock, CheckCircle2 } from 'lucide-react-native';
import { BuildStatus } from '@lynxkit/shared';
import { buildApi } from '../../../src/lib/api';
import { useBuild } from '../../../src/hooks/use-build';

/**
 * 构建配置页（移动端简化版）
 *
 * - clarifying / draft 状态：可编辑澄清问题表单，提交后调用 updateConfig
 * - 其他状态：只读展示已提交的配置项
 * - 架构产物（session.architecture）存在时展示技术栈卡片
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */

/** 通用澄清问题（3 个） */
const CLARIFY_FIELDS = [
  { id: 'targetUsers', labelKey: 'build.targetUsers', placeholder: '18-25 岁都市白领' },
  { id: 'coreFeatures', labelKey: 'build.coreFeatures', placeholder: '兴趣匹配 + 匿名聊天' },
  { id: 'designStyle', labelKey: 'build.designStyle', placeholder: '极简 / 活泼 / 商务' },
] as const;

export default function ConfigureScreen() {
  const { t } = useTranslation();
  const isDark = useColorScheme() === 'dark';
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['build', id],
    queryFn: () => buildApi.getById(id!),
    enabled: !!id,
  });

  const { updateConfig } = useBuild();

  // 表单答案：{ fieldId: value }
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // 从会话 config 回填已有答案
  useEffect(() => {
    if (!session) return;
    const cfg = session.config ?? {};
    const initial: Record<string, string> = {};
    for (const field of CLARIFY_FIELDS) {
      const v = cfg[field.id];
      if (typeof v === 'string') initial[field.id] = v;
    }
    setAnswers(initial);
  }, [session]);

  const submitMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      updateConfig(id!, patch, true),
    onSuccess: () => {
      refetch();
    },
  });

  if (isLoading || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-100 dark:bg-ink-950">
        <ActivityIndicator color="#09090B" />
      </View>
    );
  }

  const status = session.status;
  const editable =
    status === BuildStatus.CLARIFYING || status === BuildStatus.DRAFT;
  const userInput =
    (session.config?.userInput as string | undefined) ??
    (session.config?.input as string | undefined) ??
    '';

  const onSubmit = () => {
    submitMutation.mutate({ ...answers, userInput });
  };

  const architecture = session.architecture;
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  return (
    <SafeAreaView className="flex-1 bg-ink-100 dark:bg-ink-950" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="px-4 pb-8 gap-5 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* 状态徽标（badge-glass） */}
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2.5 py-1 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
            {editable ? (
              <Save size={12} color="#09090B" />
            ) : (
              <Lock size={12} color="#71717A" />
            )}
            <Text className="text-xs text-ink-700 dark:text-ink-300">
              {editable ? t('build.configure') : t('build.readOnly')}
            </Text>
          </View>
          <View className="rounded-full border border-white/70 bg-white/70 px-2.5 py-1 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
            <Text className="text-xs text-ink-700 dark:text-ink-300">
              {t(`build.status.${status}`)}
            </Text>
          </View>
        </View>

        {/* 原始需求（只读毛玻璃卡） */}
        {userInput ? (
          <View className="gap-1.5">
            <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {t('build.sessionTitle')}
            </Text>
            <View className="rounded-xl border border-white/70 bg-white/55 p-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/55">
              <Text className="text-sm text-ink-700 dark:text-ink-200">
                {userInput}
              </Text>
            </View>
          </View>
        ) : null}

        {/* 澄清问题表单（毛玻璃输入框） */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
            {t('build.clarifyQuestions')}
          </Text>

          {CLARIFY_FIELDS.map((field) => (
            <View key={field.id} className="gap-1.5">
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                {t(field.labelKey)}
              </Text>
              {editable ? (
                <TextInput
                  value={answers[field.id] ?? ''}
                  onChangeText={(v) =>
                    setAnswers((prev) => ({ ...prev, [field.id]: v }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor="#A1A1AA"
                  multiline
                  className="rounded-xl border border-white/70 bg-white/55 px-3 py-2.5 text-sm text-ink-900 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/55 dark:text-ink-50"
                />
              ) : (
                <View className="rounded-xl border border-white/70 bg-white/55 px-3 py-2.5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/55">
                  <Text className="text-sm text-ink-700 dark:text-ink-200">
                    {answers[field.id] || '（未填写）'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* 架构产物（ARCHITECT Agent 生成） */}
        {architecture ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              {t('build.architecture')}
            </Text>
            <View className="gap-2 rounded-2xl border border-white/70 bg-white/70 p-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
              <View className="gap-0.5">
                <Text className="text-xs text-ink-500 dark:text-ink-400">
                  {t('build.frontendStack')}
                </Text>
                <Text className="text-sm text-ink-900 dark:text-ink-50">
                  {architecture.frontend.join(' / ')}
                </Text>
              </View>
              <View className="gap-0.5">
                <Text className="text-xs text-ink-500 dark:text-ink-400">
                  {t('build.backendStack')}
                </Text>
                <Text className="text-sm text-ink-900 dark:text-ink-50">
                  {architecture.backend.join(' / ')}
                </Text>
              </View>
              <View className="gap-0.5">
                <Text className="text-xs text-ink-500 dark:text-ink-400">
                  {t('build.databaseStack')}
                </Text>
                <Text className="text-sm text-ink-900 dark:text-ink-50">
                  {architecture.database.join(' / ')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* 提交按钮（纯黑）/ 已提交徽标 */}
        {editable ? (
          <Pressable
            onPress={onSubmit}
            disabled={submitMutation.isPending}
            className="flex-row items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
          >
            <Save size={16} color={emphasisIcon} />
            <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
              {submitMutation.isPending
                ? t('common.loading')
                : t('build.submitConfig')}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-center gap-2 rounded-full border border-ink-300 bg-transparent py-3.5 dark:border-ink-700">
            <CheckCircle2 size={16} color="#71717A" />
            <Text className="text-sm font-semibold text-ink-500 dark:text-ink-400">
              {t('build.readOnly')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
