import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@lynxkit/store';
import { matchProductType, type BuildSession } from '@lynxkit/shared';
import { buildApi, storeApi } from '../../src/lib/api';
import { useBuild } from '../../src/hooks/use-build';
import { InspirationInput } from '../../src/components/inspiration-input';
import { EmptyState } from '../../src/components/empty-state';
import { ProductCard } from '../../src/components/product-card';
import { Hammer, Store, ChevronRight, Sparkles } from 'lucide-react-native';

export default function HomeScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const user = useAuthStore((s) => s.user);
  const { createAndStart } = useBuild();
  const [creating, setCreating] = useState(false);
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['builds', 'recent'],
    queryFn: () => buildApi.list(),
  });

  const { data: storeRes } = useQuery({
    queryKey: ['store', 'home', 'recommended'],
    queryFn: () => storeApi.list({ page: 1, pageSize: 3 }),
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

  const recommended = (storeRes?.items ?? []).slice(0, 3);

  return (
    <FlatList
      data={(sessions ?? []).slice(0, 5)}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}
      contentContainerClassName="px-4 gap-6"
      ListHeaderComponent={
        <View className="gap-6">
          {/* 欢迎语 + 头像 */}
          <View className="flex-row items-center justify-between">
            <View className="gap-1 flex-1">
              <Text className="text-sm text-ink-500 dark:text-ink-400">
                {t('home.greeting')}
              </Text>
              <Text
                className="text-2xl font-semibold text-ink-900 dark:text-ink-50"
                numberOfLines={1}
              >
                {user?.name ?? user?.email ?? t('home.defaultNickname')}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              className="h-12 w-12 items-center justify-center rounded-full bg-ink-950 active:opacity-80 dark:bg-ink-100"
            >
              <Text className="text-lg font-semibold text-ink-0 dark:text-ink-950">
                {(user?.name ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>

          {/* 灵感输入区 */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
              {t('home.inspirationPlaceholder')}
            </Text>
            <Text className="text-xs text-ink-500 dark:text-ink-400">
              {t('home.inspirationHint')}
            </Text>
          </View>

          <InspirationInput onCreate={handleCreate} loading={creating} />

          {/* 快捷操作入口 */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push('/(tabs)/build')}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-ink-300 bg-transparent py-3 active:opacity-80 dark:border-ink-700"
            >
              <Hammer size={16} color="#09090B" />
              <Text className="text-sm font-medium text-ink-900 dark:text-ink-50">
                {t('home.recentBuilds')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/store')}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-ink-950 py-3 active:opacity-80 dark:bg-ink-100"
            >
              <Store size={16} color={emphasisIcon} />
              <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
                {t('tabs.store')}
              </Text>
            </Pressable>
          </View>

          {/* 最近构建 */}
          <View className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
                {t('home.recentBuilds')}
              </Text>
              <Pressable onPress={() => router.push('/(tabs)/build')}>
                <Text className="text-sm text-ink-950 dark:text-ink-50">
                  {t('home.viewAll')}
                </Text>
              </Pressable>
            </View>
            {isLoading ? (
              <ActivityIndicator color="#09090B" />
            ) : null}
          </View>
        </View>
      }
      renderItem={({ item }) => <BuildRow session={item} />}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon={<Hammer size={28} color="#52525B" />}
            title={t('home.emptyBuilds')}
            subtitle={t('home.emptyBuildsHint')}
          />
        ) : null
      }
      ListFooterComponent={
        recommended.length > 0 ? (
          <View className="gap-3 pt-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#09090B" />
                <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
                  {t('tabs.store')}
                </Text>
              </View>
              <Pressable onPress={() => router.push('/(tabs)/store')}>
                <ChevronRight size={18} color="#52525B" />
              </Pressable>
            </View>
            {recommended.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onPress={(prod) => router.push(`/store/${prod.id}`)}
              />
            ))}
          </View>
        ) : null
      }
    />
  );
}

function BuildRow({ session }: { session: BuildSession }) {
  return (
    <Pressable
      onPress={() => router.push(`/build/${session.id}`)}
      className="flex-row items-center gap-3 rounded-2xl border border-white/70 bg-white/70 p-3.5 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
    >
      <View className="h-10 w-1.5 rounded-full bg-ink-950 dark:bg-ink-50" />
      <View className="flex-1 gap-0.5">
        <Text
          className="text-sm font-semibold text-ink-900 dark:text-ink-50"
          numberOfLines={1}
        >
          {String(session.config?.name ?? session.productType)}
        </Text>
        <Text className="text-xs text-ink-500 dark:text-ink-400">
          {session.status}
        </Text>
      </View>
      <Text className="text-xs text-ink-500 dark:text-ink-400">
        {new Date(session.updatedAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );
}
