import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Rocket,
  Server,
  Globe,
  GitBranch,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Package,
  RotateCcw,
} from 'lucide-react-native';
import {
  PricingType,
  StoreCategory,
} from '@lynxkit/shared';
import { buildApi, storeApi } from '../../../src/lib/api';
import { useBuild } from '../../../src/hooks/use-build';

/**
 * 部署页（移动端简化版）
 *
 * - 部署目标选择（3 个卡片：阿里云 ECS / Vercel / GitHub Pages）
 * - 部署步骤进度（6 步 mock，setTimeout 模拟）
 * - 部署完成后显示 deployUrl + 访问按钮
 * - 上架到商店表单（名称 / 简介 / 分类 / 定价）
 * - 回滚到上一版本
 *
 * 顶部导航（返回按钮 + 标题）由 Stack 路由统一渲染（见 _layout.tsx）。
 */

/** 部署目标选项 */
const DEPLOY_TARGETS = [
  {
    id: 'aliyun-ecs',
    labelKey: 'build.aliyunEcs',
    icon: Server,
  },
  {
    id: 'vercel',
    labelKey: 'build.vercel',
    icon: Globe,
  },
  {
    id: 'github-pages',
    labelKey: 'build.githubPages',
    icon: GitBranch,
  },
] as const;

/** Mock 部署步骤（6 步） */
const DEPLOY_STEPS = [
  { id: 'build', label: '本地构建产物' },
  { id: 'upload', label: '上传构建产物' },
  { id: 'install', label: '安装依赖' },
  { id: 'migrate', label: '数据库迁移' },
  { id: 'start', label: '启动服务' },
  { id: 'health', label: '健康检查' },
] as const;

type DeployPhase = 'idle' | 'deploying' | 'success' | 'error';

/** 商店分类（移动端简化为常用 6 类） */
const STORE_CATEGORIES: StoreCategory[] = [
  StoreCategory.SOCIAL,
  StoreCategory.SYSTEM,
  StoreCategory.WORKSTATION,
  StoreCategory.DATA,
  StoreCategory.ADMIN,
  StoreCategory.APP,
];

/** 定价类型选项（与 i18n build.free/paid/subscription 对齐） */
const PRICING_OPTIONS: { value: PricingType; labelKey: string }[] = [
  { value: PricingType.FREE, labelKey: 'build.free' },
  { value: PricingType.ONETIME, labelKey: 'build.paid' },
  { value: PricingType.SUBSCRIPTION, labelKey: 'build.subscription' },
];

export default function DeployScreen() {
  const { t } = useTranslation();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['build', id],
    queryFn: () => buildApi.getById(id!),
    enabled: !!id,
  });

  const { rollback } = useBuild();

  const [target, setTarget] = useState<string>('aliyun-ecs');
  const [phase, setPhase] = useState<DeployPhase>('idle');
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 上架表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<StoreCategory>(StoreCategory.SOCIAL);
  const [pricingType, setPricingType] = useState<PricingType>(PricingType.FREE);
  const [price, setPrice] = useState('');

  // 会话加载后若已有 deployUrl 则进入 success 态
  useEffect(() => {
    if (session?.deployUrl) {
      setDeployUrl(session.deployUrl);
      setPhase('success');
    }
  }, [session?.deployUrl]);

  // 卸载时清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 预填上架表单（首次拿到 session 时）
  useEffect(() => {
    if (!session || name) return;
    const userInput =
      (session.config?.userInput as string | undefined) ?? '';
    setName(userInput.slice(0, 40) || t('build.productName'));
    setDescription(userInput);
    if (deployUrl) {
      // demoUrl 已隐含在 deployUrl
    }
  }, [session, name, t, deployUrl]);

  const runDeploy = () => {
    if (phase === 'deploying') return;
    setPhase('deploying');
    setCurrentStep(0);
    let step = 0;

    const tick = () => {
      step += 1;
      if (step >= DEPLOY_STEPS.length) {
        const url = `https://lynxkit-${id!.slice(0, 8)}.aliyuncs.com`;
        setDeployUrl(url);
        setPhase('success');
        setCurrentStep(DEPLOY_STEPS.length);
        // 回写会话 deployUrl（mock）
        buildApi
          .updateConfig(id!, { patch: { deployUrl: url }, confirmClarify: false })
          .catch(() => {});
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      setCurrentStep(step);
      timerRef.current = setTimeout(tick, 900);
    };

    timerRef.current = setTimeout(tick, 900);
  };

  const onRollback = () => {
    if (!session) return;
    Alert.alert(
      t('build.rollback'),
      t('build.rollbackConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => {
            rollback(id!, session.version - 1)
              .then(() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(t('build.rollbackSuccess'));
                refetch();
              })
              .catch(() => {
                Alert.alert(t('errors.unknownError'));
              });
          },
        },
      ],
    );
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('no session');
      const priceNum =
        pricingType === PricingType.FREE
          ? 0
          : Number(price) || 0;
      return storeApi.publish({
        sessionId: id!,
        name,
        description,
        category,
        productType: session.productType,
        pricingType,
        price: priceNum,
        demoUrl: deployUrl ?? undefined,
        version: '1.0.0',
      });
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('build.publishSuccess'));
    },
  });

  const onPublish = () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert(t('build.productName'), t('build.productDesc'));
      return;
    }
    publishMutation.mutate();
  };

  if (isLoading || !session) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  const canDeploy =
    phase === 'idle' || phase === 'error';

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['bottom']}>
      <ScrollView
        contentContainerClassName="px-4 pb-8 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* 状态徽标 */}
        <View className="flex-row items-center gap-2 pt-4">
          <View
            className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${phase === 'success' ? 'bg-green-500/20' : phase === 'deploying' ? 'bg-lynx-500/20' : 'bg-slate-800'}`}
          >
            {phase === 'success' ? (
              <CheckCircle2 size={12} color="#22C55E" />
            ) : phase === 'deploying' ? (
              <Loader2 size={12} color="#FF6B35" />
            ) : (
              <AlertCircle size={12} color="#94A3B8" />
            )}
            <Text
              className={`text-xs ${phase === 'success' ? 'text-green-500' : phase === 'deploying' ? 'text-lynx-500' : 'text-slate-400'}`}
            >
              {phase === 'success'
                ? t('build.status.deployed')
                : phase === 'deploying'
                  ? t('build.status.deploying')
                  : t('build.deployTitle')}
            </Text>
          </View>
        </View>

        {/* 部署目标 */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-200">
            {t('build.deployTarget')}
          </Text>
          <View className="gap-2">
            {DEPLOY_TARGETS.map((tgt) => {
              const Icon = tgt.icon;
              const active = target === tgt.id;
              return (
                <Pressable
                  key={tgt.id}
                  onPress={() => phase !== 'deploying' && setTarget(tgt.id)}
                  disabled={phase === 'deploying'}
                  className={`flex-row items-center gap-3 rounded-xl border p-3 ${active ? 'border-lynx-500 bg-lynx-500/10' : 'border-slate-800 bg-slate-900'} ${phase === 'deploying' ? 'opacity-50' : ''}`}
                >
                  <Icon size={18} color={active ? '#FF6B35' : '#94A3B8'} />
                  <Text
                    className={`flex-1 text-sm ${active ? 'text-lynx-500' : 'text-slate-300'}`}
                  >
                    {t(tgt.labelKey)}
                  </Text>
                  {active ? (
                    <CheckCircle2 size={16} color="#FF6B35" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 部署步骤 */}
        <View className="gap-2">
          <Text className="text-sm font-semibold text-slate-200">
            {t('build.deploySteps')}
          </Text>
          <View className="gap-1.5">
            {DEPLOY_STEPS.map((s, i) => {
              const done = phase === 'success' || i < currentStep;
              const active = phase === 'deploying' && i === currentStep;
              return (
                <View
                  key={s.id}
                  className={`flex-row items-center gap-3 rounded-lg px-3 py-2 ${active ? 'bg-lynx-500/10' : 'bg-slate-900'}`}
                >
                  {done ? (
                    <CheckCircle2 size={14} color="#22C55E" />
                  ) : active ? (
                    <Loader2 size={14} color="#FF6B35" />
                  ) : (
                    <View className="h-3.5 w-3.5 items-center justify-center rounded-full border border-slate-700">
                      <Text className="text-[9px] text-slate-500">
                        {i + 1}
                      </Text>
                    </View>
                  )}
                  <Text className="flex-1 text-xs text-slate-300">
                    {s.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 部署 / 回滚 按钮 */}
        <View className="flex-row gap-3">
          {phase === 'success' && session.version > 1 ? (
            <Pressable
              onPress={onRollback}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3.5 active:opacity-80"
            >
              <RotateCcw size={16} color="#F8FAFC" />
              <Text className="text-sm font-semibold text-white">
                {t('build.rollback')}
              </Text>
            </Pressable>
          ) : null}
          {canDeploy ? (
            <Pressable
              onPress={runDeploy}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-lynx-500 py-3.5 active:opacity-80"
            >
              <Rocket size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">
                {t('build.deploy')}
              </Text>
            </Pressable>
          ) : phase === 'deploying' ? (
            <View className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-slate-800 py-3.5 opacity-50">
              <Loader2 size={16} color="#94A3B8" />
              <Text className="text-sm font-semibold text-slate-400">
                {t('build.status.deploying')}…
              </Text>
            </View>
          ) : null}
        </View>

        {/* 部署结果 */}
        {phase === 'success' && deployUrl ? (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-slate-200">
              {t('build.deployResult')}
            </Text>
            <View className="flex-row items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 p-3">
              <Globe size={14} color="#FF6B35" />
              <Text
                className="flex-1 text-xs text-lynx-500"
                numberOfLines={1}
              >
                {deployUrl}
              </Text>
              <Pressable
                onPress={() => Linking.openURL(deployUrl)}
                className="flex-row items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 active:opacity-80"
              >
                <ExternalLink size={12} color="#F8FAFC" />
                <Text className="text-xs text-slate-200">
                  {t('build.visitUrl')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* 上架到商店表单 */}
        {phase === 'success' && deployUrl ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <Package size={16} color="#FF6B35" />
              <Text className="text-sm font-semibold text-slate-200">
                {t('build.publishToStore')}
              </Text>
            </View>

            {/* 产品名称 */}
            <View className="gap-1.5">
              <Text className="text-xs text-slate-400">
                {t('build.productName')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('build.productName')}
                placeholderTextColor="#64748B"
                className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-200"
              />
            </View>

            {/* 产品简介 */}
            <View className="gap-1.5">
              <Text className="text-xs text-slate-400">
                {t('build.productDesc')}
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder={t('build.productDesc')}
                placeholderTextColor="#64748B"
                multiline
                className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-200"
              />
            </View>

            {/* 分类按钮组 */}
            <View className="gap-1.5">
              <Text className="text-xs text-slate-400">
                {t('build.category')}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {STORE_CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCategory(c)}
                      className={`rounded-full px-3 py-1.5 ${active ? 'bg-lynx-500' : 'bg-slate-800'}`}
                    >
                      <Text
                        className={`text-xs ${active ? 'text-white' : 'text-slate-300'}`}
                      >
                        {t(`store.category.${c.toLowerCase()}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 定价类型按钮组 */}
            <View className="gap-1.5">
              <Text className="text-xs text-slate-400">
                {t('build.pricing')}
              </Text>
              <View className="flex-row gap-2">
                {PRICING_OPTIONS.map((opt) => {
                  const active = pricingType === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setPricingType(opt.value)}
                      className={`flex-1 items-center rounded-xl py-2 ${active ? 'bg-lynx-500' : 'bg-slate-800'}`}
                    >
                      <Text
                        className={`text-xs ${active ? 'text-white' : 'text-slate-300'}`}
                      >
                        {t(opt.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 价格（非免费时显示） */}
            {pricingType !== PricingType.FREE ? (
              <View className="gap-1.5">
                <Text className="text-xs text-slate-400">
                  {t('build.price')}
                </Text>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  placeholder="1990"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  className="rounded-xl bg-slate-900 px-3 py-2.5 text-sm text-slate-200"
                />
              </View>
            ) : null}

            {/* 发布按钮 */}
            <Pressable
              onPress={onPublish}
              disabled={publishMutation.isPending}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-lynx-500 py-3.5 active:opacity-80 disabled:opacity-40"
            >
              <Package size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">
                {publishMutation.isPending
                  ? t('common.loading')
                  : t('build.publish')}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
