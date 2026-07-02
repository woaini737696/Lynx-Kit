import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { BuildSession, BuildStatus } from '@lynxkit/shared';
import { buildApi } from '../../src/lib/api';
import { EmptyState } from '../../src/components/empty-state';
import { Hammer } from 'lucide-react-native';

const STATUS_LABEL: Record<BuildStatus, string> = {
  draft: '草稿',
  clarify: '澄清中',
  architecting: '架构设计中',
  developing: '开发中',
  testing: '测试中',
  deploying: '部署中',
  deployed: '已部署',
  error: '错误',
};

const STATUS_COLOR: Record<BuildStatus, string> = {
  draft: '#64748B',
  clarify: '#3B82F6',
  architecting: '#3B82F6',
  developing: '#F59E0B',
  testing: '#F59E0B',
  deploying: '#F59E0B',
  deployed: '#22C55E',
  error: '#EF4444',
};

export default function BuildListScreen() {
  const { data: sessions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['builds', 'all'],
    queryFn: () => buildApi.list(),
  });

  return (
    <View className="flex-1 bg-slate-950">
      <View className="px-4 pt-12 pb-3">
        <Text className="text-2xl font-bold text-white">我的构建</Text>
      </View>
      <FlatList
        data={sessions ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 gap-3 pb-6"
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Hammer size={28} color="#64748B" />}
              title="还没有构建"
              subtitle="去首页输入灵感，开始构建你的产品"
              actionLabel="去构建"
              onAction={() => router.push('/(tabs)/home')}
            />
          ) : null
        }
        renderItem={({ item }) => <BuildCard session={item} />}
      />
    </View>
  );
}

function BuildCard({ session }: { session: BuildSession }) {
  const color = STATUS_COLOR[session.status] ?? '#64748B';
  return (
    <Pressable
      onPress={() => router.push(`/build/${session.id}`)}
      className="gap-2 rounded-2xl bg-slate-800 p-4 active:opacity-80"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-slate-100" numberOfLines={1}>
          {String(session.config?.name ?? session.productType)}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <Text className="text-xs" style={{ color }}>
            {STATUS_LABEL[session.status]}
          </Text>
        </View>
      </View>
      <Text className="text-xs text-slate-500">
        版本 v{session.version} · 更新于{' '}
        {new Date(session.updatedAt).toLocaleString()}
      </Text>
    </Pressable>
  );
}
