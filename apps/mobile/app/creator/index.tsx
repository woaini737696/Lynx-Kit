import {
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '../../src/lib/api';
import {
  Package,
  TrendingUp,
  Wallet,
  Star,
  ChevronRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';

export default function CreatorCenterScreen() {
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';
  const subtleIcon = isDark ? '#A1A1AA' : '#71717A';
  const verifiedIcon = isDark ? '#09090B' : '#FFFFFF';

  const { data: profile } = useQuery({
    queryKey: ['creator', 'profile'],
    queryFn: () => creatorApi.getProfile(),
  });
  const { data: stats } = useQuery({
    queryKey: ['creator', 'stats'],
    queryFn: () => creatorApi.getStats(),
  });

  const enableCreator = async () => {
    try {
      await creatorApi.enable({ displayName: '创作者' });
    } catch (e) {
      console.error(e);
    }
  };

  if (!profile) {
    return (
      <ScrollView
        className="flex-1 bg-ink-100 dark:bg-ink-950"
        contentContainerClassName="px-6 py-12 items-center gap-5"
      >
        <View className="h-20 w-20 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
          <Sparkles size={32} color={emphasisIcon} />
        </View>
        <View className="gap-2 items-center">
          <Text className="text-2xl font-bold text-ink-900 dark:text-ink-50">
            开通创作者中心
          </Text>
          <Text className="text-center text-sm text-ink-500 dark:text-ink-400">
            上架你的 AI 产品，获取收益。开通后即可发布到商店。
          </Text>
        </View>
        <Pressable
          onPress={enableCreator}
          className="mt-2 items-center justify-center rounded-full bg-ink-950 px-8 py-4 active:opacity-80 dark:bg-ink-100"
        >
          <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
            立即开通
          </Text>
        </Pressable>
      </ScrollView>
    );
  }

  const cards = [
    {
      label: '累计收益',
      value: `¥${(stats?.totalIncome ?? profile.totalIncome / 100).toFixed(2)}`,
      icon: TrendingUp,
    },
    {
      label: '可提现',
      value: `¥${(stats?.balance ?? profile.balance / 100).toFixed(2)}`,
      icon: Wallet,
    },
    {
      label: '产品数',
      value: String(stats?.productCount ?? profile.productCount),
      icon: Package,
    },
    {
      label: '平均评分',
      value: (stats?.avgRating ?? profile.avgRating).toFixed(1),
      icon: Star,
    },
  ];

  return (
    <ScrollView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      contentContainerClassName="px-4 py-5 gap-5"
    >
      {/* 创作者头部 */}
      <View
        className="items-center gap-2 rounded-3xl border border-ink-200/60 bg-white/70 px-6 py-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70"
      >
        <View className="h-16 w-16 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
          <Text className="text-2xl font-bold text-ink-0 dark:text-ink-950">
            {(profile.displayName || 'C').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text className="text-lg font-bold text-ink-900 dark:text-ink-50">
          {profile.displayName}
        </Text>
        {profile.verified ? (
          <View className="mt-1 flex-row items-center gap-1.5 rounded-full bg-ink-950 px-3 py-1 dark:bg-ink-100">
            <CheckCircle2 size={12} color={verifiedIcon} />
            <Text className="text-xs font-medium text-ink-0 dark:text-ink-950">
              已认证创作者
            </Text>
          </View>
        ) : null}
      </View>

      {/* 数据概览：2 列网格 */}
      <View className="flex-row flex-wrap gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <View
              key={c.label}
              className="flex-1 gap-2 rounded-3xl border border-ink-200/60 bg-white/70 p-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70"
            >
              <View className="h-9 w-9 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
                <Icon size={16} color={emphasisIcon} />
              </View>
              <Text className="mt-1 text-xl font-bold text-ink-900 dark:text-ink-50">
                {c.value}
              </Text>
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                {c.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 产品管理入口 */}
      <Pressable
        onPress={() => router.push('/creator/products')}
        className="flex-row items-center gap-3 rounded-3xl border border-ink-200/60 bg-white/70 px-5 py-4 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
      >
        <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
          <Package size={18} color={emphasisIcon} />
        </View>
        <Text className="flex-1 text-base font-medium text-ink-900 dark:text-ink-50">
          产品管理
        </Text>
        <ChevronRight size={18} color={subtleIcon} />
      </Pressable>
    </ScrollView>
  );
}
