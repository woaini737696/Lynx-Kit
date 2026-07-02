import { FlatList, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import type { StoreProduct } from '@lynxkit/shared';
import { creatorApi } from '../../src/lib/api';
import { ProductCard } from '../../src/components/product-card';
import { EmptyState } from '../../src/components/empty-state';
import { Plus, Package } from 'lucide-react-native';

export default function CreatorProductsScreen() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['creator', 'products'],
    queryFn: () => creatorApi.listProducts(),
  });

  return (
    <View className="flex-1 bg-slate-950">
      <FlatList
        data={products ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 py-3 gap-3"
        ListHeaderComponent={
          <Pressable
            onPress={() => router.push('/(tabs)/home')}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-lynx-500/40 bg-lynx-500/10 py-3 active:opacity-80"
          >
            <Plus size={18} color="#FF6B35" />
            <Text className="text-sm font-semibold text-lynx-500">发布新产品</Text>
          </Pressable>
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon={<Package size={28} color="#64748B" />}
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
