import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BuildSession, BuildStatus } from '@lynxkit/shared';
import { buildApi } from '../../src/lib/api';
import { EmptyState } from '../../src/components/empty-state';
import { Hammer, Trash2 } from 'lucide-react-native';

const STATUS_LABEL: Record<BuildStatus, string> = {
  draft: '草稿',
  clarifying: '澄清中',
  architecting: '架构设计中',
  developing: '开发中',
  testing: '测试中',
  deploying: '部署中',
  deployed: '已部署',
  error: '错误',
};

const STATUS_COLOR: Record<BuildStatus, string> = {
  draft: '#64748B',
  clarifying: '#3B82F6',
  architecting: '#3B82F6',
  developing: '#F59E0B',
  testing: '#F59E0B',
  deploying: '#F59E0B',
  deployed: '#22C55E',
  error: '#EF4444',
};

export default function BuildListScreen() {
  const queryClient = useQueryClient();
  const { data: sessions, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['builds', 'all'],
    queryFn: () => buildApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => buildApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    },
  });

  const handleDelete = (session: BuildSession) => {
    Alert.alert(
      '删除构建',
      `确定要删除「${String(session.config?.name ?? session.productType)}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(session.id),
        },
      ],
    );
  };

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
        renderItem={({ item }) => <BuildCard session={item} onDelete={() => handleDelete(item)} />}
      />
    </View>
  );
}

function BuildCard({
  session,
  onDelete,
}: {
  session: BuildSession;
  onDelete: () => void;
}) {
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
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-slate-500">
          版本 v{session.version} · 更新于{' '}
          {new Date(session.updatedAt).toLocaleString()}
        </Text>
        <Pressable
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          className="active:opacity-50"
        >
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );
}
