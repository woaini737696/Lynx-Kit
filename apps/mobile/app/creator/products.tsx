import {
  FlatList,
  Pressable,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { StoreProduct } from '@lynxkit/shared';
import { creatorApi } from '../../src/lib/api';
import { ProductCard } from '../../src/components/product-card';
import { EmptyState } from '../../src/components/empty-state';
import { Plus, Package } from 'lucide-react-native';

export default function CreatorProductsScreen() {
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';

  const { data: products, isLoading } = useQuery({
    queryKey: ['creator', 'products'],
    queryFn: () => creatorApi.listProducts(),
  });

  return (
    <View className="flex-1 bg-ink-100 dark:bg-ink-950">
      <FlatList
        data={products ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-4 gap-3"
        ListHeaderComponent={
          <Pressable
            onPress={() => router.push('/(tabs)/home')}
            className="flex-row items-center justify-center gap-2 rounded-full border border-ink-300 bg-transparent py-3.5 active:opacity-80 dark:border-ink-700"
          >
            <View className="h-6 w-6 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
              <Plus size={12} color={emphasisIcon} />
            </View>
            <Text className="text-sm font-semibold text-ink-950 dark:text-ink-50">
              发布新产品
            </Text>
          </Pressable>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Package size={28} color="#A1A1AA" />}
              title="还没有上架产品"
              subtitle="构建完成后即可发布到商店"
            />
          ) : null
        }
        renderItem={({ item }: { item: StoreProduct }) => (
          <ProductCard
            product={item}
            onPress={(p) => router.push(`/store/${p.id}`)}
          />
        )}
      />
    </View>
  );
}
