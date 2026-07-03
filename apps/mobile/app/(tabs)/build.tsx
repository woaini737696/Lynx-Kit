import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { BuildSession, BuildStatus } from '@lynxkit/shared';
import { buildApi } from '../../src/lib/api';
import { EmptyState } from '../../src/components/empty-state';
import { Hammer, Trash2 } from 'lucide-react-native';

const STATUS_LABEL_KEY: Record<BuildStatus, string> = {
  draft: 'build.status.draft',
  clarifying: 'build.status.clarifying',
  architecting: 'build.status.architecting',
  developing: 'build.status.developing',
  testing: 'build.status.testing',
  deploying: 'build.status.deploying',
  deployed: 'build.status.deployed',
  error: 'build.status.error',
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
  const { t } = useTranslation();
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
      t('build.deleteBuild'),
      `确定要删除「${String(session.config?.name ?? session.productType)}」吗？`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteMutation.mutate(session.id),
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-slate-950">
      <View className="px-4 pt-12 pb-3">
        <Text className="text-2xl font-bold text-white">{t('build.myBuilds')}</Text>
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
              title={t('build.empty')}
              subtitle={t('build.emptyHint')}
              actionLabel={t('build.goBuild')}
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
  const { t } = useTranslation();
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
            {t(STATUS_LABEL_KEY[session.status])}
          </Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-slate-500">
          {t('build.version', { version: session.version })} ·{' '}
          {t('build.updatedAt', { time: new Date(session.updatedAt).toLocaleString() })}
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
