import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StoreCategory, type StoreProduct } from '@lynxkit/shared';
import { storeApi } from '../../src/lib/api';
import { ProductCard } from '../../src/components/product-card';
import { EmptyState } from '../../src/components/empty-state';
import { Store, Search } from 'lucide-react-native';

const PAGE_SIZE = 10;

export default function StoreScreen() {
  const { t } = useTranslation();
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
        storeApi.list({ category: category ?? undefined, q: debouncedSearch || undefined, page: pageParam, pageSize: PAGE_SIZE }),
      getNextPageParam: (last) =>
        last.page < last.totalPages ? last.page + 1 : undefined,
      initialPageParam: 1,
    });

  const products: StoreProduct[] =
    data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <View className="flex-1 bg-slate-950">
      <View className="px-4 pt-12 pb-3">
        <Text className="text-2xl font-bold text-white">{t('store.title')}</Text>
      </View>

      <View className="px-4 pb-3">
        <View className="flex-row items-center gap-2 rounded-xl bg-slate-800 px-3 py-2.5">
          <Search size={18} color="#64748B" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('store.searchPlaceholder')}
            placeholderTextColor="#64748B"
            className="flex-1 text-sm text-white"
            returnKeyType="search"
          />
        </View>
      </View>

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
              className={`rounded-full px-3.5 py-1.5 ${
                active ? 'bg-lynx-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  active ? 'text-white' : 'text-slate-300'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 gap-3 pb-6 pt-2"
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          isLoading ? (
            <ActivityIndicator color="#FF6B35" className="py-8" />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Store size={28} color="#64748B" />}
              title={t('store.noProducts')}
              subtitle={t('store.noProductsHint')}
            />
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color="#FF6B35" className="py-4" />
          ) : null
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={(p) => router.push(`/store/${p.id}`)}
          />
        )}
      />
    </View>
  );
}
