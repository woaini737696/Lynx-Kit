import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@lynxkit/store';
import { matchProductType, type BuildSession } from '@lynxkit/shared';
import { buildApi } from '../../src/lib/api';
import { useBuild } from '../../src/hooks/use-build';
import { InspirationInput } from '../../src/components/inspiration-input';
import { EmptyState } from '../../src/components/empty-state';
import { Hammer } from 'lucide-react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { createAndStart } = useBuild();
  const [creating, setCreating] = useState(false);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['builds', 'recent'],
    queryFn: () => buildApi.list(),
  });

  const handleCreate = async (text: string) => {
    const matched = matchProductType(text);
    setCreating(true);
    try {
      await createAndStart({
        productType: matched?.type ?? ('app' as never),
        userInput: text,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <FlatList
      data={(sessions ?? []).slice(0, 5)}
      keyExtractor={(item) => item.id}
      contentContainerClassName="px-4 pt-12 pb-6 gap-5"
      ListHeaderComponent={
        <View className="gap-6">
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="text-sm text-slate-400">{t('home.greeting')}</Text>
              <Text className="text-2xl font-bold text-white">
                {user?.name ?? user?.email ?? t('home.defaultNickname')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              className="h-11 w-11 items-center justify-center rounded-full bg-lynx-500"
            >
              <Text className="text-lg font-bold text-white">
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>

          <View className="gap-2">
            <Text className="text-base font-semibold text-slate-200">
              {t('home.inspirationPlaceholder')}
            </Text>
            <Text className="text-xs text-slate-400">
              {t('home.inspirationHint')}
            </Text>
          </View>

          <InspirationInput onCreate={handleCreate} loading={creating} />

          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-slate-200">
                {t('home.recentBuilds')}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/build')}>
                <Text className="text-sm text-lynx-500">{t('home.viewAll')}</Text>
              </Pressable>
            </View>
            {isLoading ? (
              <ActivityIndicator color="#FF6B35" />
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item }) => <BuildRow session={item} />}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={<Hammer size={28} color="#64748B" />}
            title={t('home.emptyBuilds')}
            subtitle={t('home.emptyBuildsHint')}
          />
        ) : null
      }
    />
  );
}

function BuildRow({ session }: { session: BuildSession }) {
  return (
    <Pressable
      onPress={() => router.push(`/build/${session.id}`)}
      className="flex-row items-center gap-3 rounded-2xl bg-slate-800 p-3.5 active:opacity-80"
    >
      <View className="h-10 w-1.5 rounded-full bg-lynx-500" />
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-slate-100" numberOfLines={1}>
          {String(session.config?.name ?? session.productType)}
        </Text>
        <Text className="text-xs text-slate-400">{session.status}</Text>
      </View>
      <Text className="text-xs text-slate-500">
        {new Date(session.updatedAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}
