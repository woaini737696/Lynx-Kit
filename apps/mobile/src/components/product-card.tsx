import { Pressable, Text, View } from 'react-native';
import { Star, Download } from 'lucide-react-native';
import type { StoreProduct } from '@lynxkit/shared';

interface ProductCardProps {
  product: StoreProduct;
  onPress?: (product: StoreProduct) => void;
}

/** 商店产品卡片 */
export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row gap-3 rounded-2xl bg-slate-800 p-3 active:opacity-80"
    >
      <View className="h-14 w-14 items-center justify-center rounded-xl bg-lynx-500/20">
        <Text className="text-2xl">📦</Text>
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-slate-100" numberOfLines={1}>
          {product.name}
        </Text>
        <Text className="text-xs text-slate-400" numberOfLines={2}>
          {product.description}
        </Text>
        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Star size={12} color="#F59E0B" fill="#F59E0B" />
            <Text className="text-xs text-slate-300">
              {product.ratingAvg.toFixed(1)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Download size={12} color="#94A3B8" />
            <Text className="text-xs text-slate-400">
              {product.downloadCount}
            </Text>
          </View>
          <Text className="ml-auto text-sm font-semibold text-lynx-500">
            {product.price === 0 ? '免费' : `¥${(product.price / 100).toFixed(2)}`}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
