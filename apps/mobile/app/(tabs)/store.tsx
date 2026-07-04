import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StoreCategory, type StoreProduct } from '@lynxkit/shared';
import { storeApi } from '../../src/lib/api';
import { EmptyState } from '../../src/components/empty-state';
import { Store, Search, Package } from 'lucide-react-native';

const PAGE_SIZE = 10;

export default function StoreScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<StoreCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const CATEGORIES: { label: string; value: StoreCategory | null }[] = [
    { label: t('store.category.all'), value: null },
    { label: t('store.category.social'), value: StoreCategory.SOCIAL },
    { label: t('store.category.system'), value: StoreCategory.SYSTEM },
    { label: t('store.category.workstation'), value: StoreCategory.WORKSTATION },
    { label: t('store.category.data'), value: StoreCategory.DATA },
    { label: t('store.category.admin'), value: StoreCategory.ADMIN },
    { label: t('store.category.app'), value: StoreCategory.APP },
    { label: t('store.category.marketing'), value: StoreCategory.MARKETING },
    { label: t('store.category.hardware'), value: StoreCategory.HARDWARE },
    { label: t('store.category.agent'), value: StoreCategory.AGENT },
    { label: t('store.category.workflow'), value: StoreCategory.WORKFLOW },
  ];

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ['store', category, debouncedSearch],
      queryFn: ({ pageParam = 1 }) =>
        storeApi.list({
          category: category ?? undefined,
          q: debouncedSearch || undefined,
          page: pageParam,
          pageSize: PAGE_SIZE,
        }),
      getNextPageParam: (last) =>
        last.page < last.totalPages ? last.page + 1 : undefined,
      initialPageParam: 1,
    });

  const products: StoreProduct[] = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View className="flex-1 bg-ink-100 dark:bg-ink-950">
      {/* 标题 */}
      <View style={{ paddingTop: insets.top + 16 }} className="px-4 pb-3">
        <Text className="text-2xl font-semibold text-ink-900 dark:text-ink-50">
          {t('store.title')}
        </Text>
      </View>

      {/* 搜索框（毛玻璃） */}
      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl border border-white/70 bg-white/55 px-3 py-2.5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/55">
          <Search size={18} color="#71717A" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('store.searchPlaceholder')}
            placeholderTextColor="#A1A1AA"
            className="flex-1 text-sm text-ink-900 dark:text-ink-50"
            returnKeyType="search"
          />
        </View>
      </View>

      {/* 分类筛选（水平滚动 Tab） */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.label}
        contentContainerClassName="px-4 gap-2 pb-3"
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const active = category === item.value;
          return (
            <Pressable
              onPress={() => setCategory(item.value)}
              className={`rounded-full px-3.5 py-1.5 active:opacity-80 ${
                active
                  ? 'bg-ink-950 dark:bg-ink-100'
                  : 'border border-ink-300 bg-transparent dark:border-ink-700'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  active
                    ? 'text-ink-0 dark:text-ink-950'
                    : 'text-ink-600 dark:text-ink-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      {/* 商品网格 grid-cols-2 */}
      <FlatList
        numColumns={2}
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="px-4 gap-3 pb-6 pt-2"
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 0 }}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isLoading ? (
            <ActivityIndicator color="#09090B" className="py-8" />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Store size={28} color="#52525B" />}
              title={t('store.noProducts')}
              subtitle={t('store.noProductsHint')}
            />
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#09090B" className="py-4" />
          ) : null
        }
        renderItem={({ item }) => (
          <StoreGridCard
            product={item}
            onPress={(p) => router.push(`/store/${p.id}`)}
          />
        )}
      />
    </View>
  );
}

/** 商店网格卡片：毛玻璃纵向布局（grid-cols-2） */
function StoreGridCard({
  product,
  onPress,
}: {
  product: StoreProduct;
  onPress: (p: StoreProduct) => void;
}) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Pressable
      onPress={() => onPress(product)}
      className="flex-1 gap-2 rounded-3xl border border-white/70 bg-white/70 p-3 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
    >
      <View className="aspect-square items-center justify-center rounded-2xl bg-ink-950 dark:bg-ink-100">
        <Package size={28} color={isDark ? '#09090B' : '#FFFFFF'} />
      </View>
      <Text
        className="text-sm font-semibold text-ink-900 dark:text-ink-50"
        numberOfLines={1}
      >
        {product.name}
      </Text>
      <Text
        className="text-xs text-ink-500 dark:text-ink-400"
        numberOfLines={2}
      >
        {product.description}
      </Text>
      <View className="flex-row items-center justify-between pt-0.5">
        <View className="flex-row items-center gap-1">
          <Text className="text-xs text-ink-950 dark:text-ink-50">★</Text>
          <Text className="text-xs text-ink-600 dark:text-ink-300">
            {product.ratingAvg.toFixed(1)}
          </Text>
        </View>
        <Text className="text-sm font-semibold text-ink-950 dark:text-ink-50">
          {product.price === 0
            ? '免费'
            : `¥${(product.price / 100).toFixed(2)}`}
        </Text>
      </View>
    </Pressable>
  );
}
