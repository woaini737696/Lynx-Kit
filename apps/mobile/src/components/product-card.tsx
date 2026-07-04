import { Pressable, Text, View, useColorScheme } from 'react-native';
import { Download, Package } from 'lucide-react-native';
import type { StoreProduct } from '@lynxkit/shared';

interface ProductCardProps {
  product: StoreProduct;
  onPress?: (product: StoreProduct) => void;
}

/** 商店产品卡片 —— 毛玻璃质感（DESIGN_SYSTEM.md §5.2） */
export function ProductCard({ product, onPress }: ProductCardProps) {
  const isDark = useColorScheme() === 'dark';
  return (
    <Pressable
      onPress={() => onPress?.(product)}
      className="flex-row gap-3 rounded-3xl border border-white/70 bg-white/70 p-3 backdrop-blur-xl active:opacity-80 dark:border-ink-800/60 dark:bg-ink-900/70"
    >
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-ink-950 dark:bg-ink-100">
        <Package size={22} color={isDark ? '#09090B' : '#FFFFFF'} />
      </View>
      <View className="flex-1 gap-1">
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
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Text className="text-xs text-ink-950 dark:text-ink-50">★</Text>
            <Text className="text-xs text-ink-600 dark:text-ink-300">
              {product.ratingAvg.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Download size={12} color="#71717A" />
            <Text className="text-xs text-ink-500 dark:text-ink-400">
              {product.downloadCount}
            </Text>
          </View>
          <Text className="ml-auto text-sm font-semibold text-ink-950 dark:text-ink-50">
            {product.price === 0 ? '免费' : `¥${(product.price / 100).toFixed(2)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
