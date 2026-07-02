import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { creatorApi } from '../../src/lib/api';
import { Package, TrendingUp, Wallet, Star, ChevronRight } from 'lucide-react-native';

export default function CreatorCenterScreen() {
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
      <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-10 items-center gap-4">
        <Text className="text-xl font-bold text-white">开通创作者中心</Text>
        <Text className="text-center text-sm text-slate-400">
          上架你的 AI 产品，获取收益。开通后即可发布到商店。
        </Text>
        <Pressable
          onPress={enableCreator}
          className="rounded-xl bg-lynx-500 px-6 py-3 active:opacity-80"
        >
          <Text className="text-base font-semibold text-white">立即开通</Text>
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
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-4 gap-5">
      <View className="items-center gap-1">
        <Text className="text-lg font-bold text-white">
          {profile.displayName}
        </Text>
        {profile.verified ? (
          <Text className="text-xs text-green-500">✓ 已认证创作者</Text>
        ) : null}
      </View>

      <View className="flex-row flex-wrap gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <View key={c.label} className="flex-1 gap-1 rounded-2xl bg-slate-800 p-4">
              <Icon size={18} color="#FF6B35" />
              <Text className="mt-2 text-lg font-bold text-white">{c.value}</Text>
              <Text className="text-xs text-slate-400">{c.label}</Text>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={() => router.push('/creator/products')}
        className="flex-row items-center gap-3 rounded-2xl bg-slate-800 px-4 py-4 active:opacity-80"
      >
        <Package size={20} color="#FF6B35" />
        <Text className="flex-1 text-base text-slate-100">产品管理</Text>
        <ChevronRight size={18} color="#475569" />
      </Pressable>
    </ScrollView>
  );
}
