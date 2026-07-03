import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Eye, ShoppingCart, ArrowLeft, Github } from 'lucide-react-native';
import { storeApi } from '../../src/lib/api';
import * as Haptics from 'expo-haptics';

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const id = Array.isArray(productId) ? productId[0] : productId;

  const { data: product } = useQuery({
    queryKey: ['store', id],
    queryFn: () => storeApi.getById(id),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['store', id, 'reviews'],
    queryFn: () => storeApi.listReviews(id),
    enabled: !!id,
  });

  const purchase = useMutation({
    mutationFn: () =>
      storeApi.purchase({
        productId: id,
        type: 'purchase',
        paymentMethod: 'alipay',
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-slate-400">加载中…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-950">
      <ScrollView contentContainerClassName="px-4 pb-6 gap-5">
        <Pressable onPress={() => router.back()} className="pt-2">
          <ArrowLeft size={22} color="#F8FAFC" />
        </Pressable>

        {/* 封面：优先使用 coverUrl，否则占位 emoji */}
        {product.coverUrl ? (
          <Image
            source={{ uri: product.coverUrl }}
            className="h-44 rounded-2xl"
            resizeMode="cover"
          />
        ) : (
          <View className="h-44 items-center justify-center rounded-2xl bg-lynx-500/20">
            <Text className="text-5xl">📦</Text>
          </View>
        )}

        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-xl font-bold text-white">{product.name}</Text>
            <View className="rounded-full bg-slate-800 px-2 py-0.5">
              <Text className="text-xs text-slate-400">v{product.version}</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-sm text-slate-300">
                {product.ratingAvg.toFixed(1)} · {product.ratingCount} 评价
              </Text>
            </View>
            <Text className="text-sm text-slate-400">
              {product.downloadCount} 次下载
            </Text>
          </View>
          <Text className="text-2xl font-bold text-lynx-500">
            {product.price === 0
              ? '免费'
              : `¥${(product.price / 100).toFixed(2)}`}
          </Text>
        </View>

        <View className="gap-2">
          <Text className="text-base font-semibold text-slate-200">产品介绍</Text>
          <Text className="text-sm leading-5 text-slate-400">
            {product.description}
          </Text>
          {product.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {product.tags.map((t) => (
                <View key={t} className="rounded-full bg-slate-800 px-2.5 py-1">
                  <Text className="text-xs text-slate-300">{t}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {product.repoUrl ? (
          <Pressable
            onPress={() => Linking.openURL(product.repoUrl!)}
            className="flex-row items-center gap-2 self-start rounded-xl bg-slate-800 px-3 py-2 active:opacity-80"
          >
            <Github size={16} color="#FF6B35" />
            <Text className="text-sm text-lynx-500">查看源码</Text>
          </Pressable>
        ) : null}

        <View className="gap-2">
          <Text className="text-base font-semibold text-slate-200">用户评价</Text>
          {(reviews ?? []).length === 0 ? (
            <Text className="text-sm text-slate-500">暂无评价</Text>
          ) : (
            (reviews ?? []).map((r) => (
              <View key={r.id} className="gap-1 rounded-xl bg-slate-800 p-3">
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" />
                  ))}
                  {r.verified ? (
                    <Text className="ml-auto text-[10px] text-green-500">
                      已购买
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm text-slate-300">{r.content}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-slate-800 px-4 py-3">
        <Pressable
          onPress={() =>
            product.demoUrl
              ? router.push({
                  pathname: '/build/preview',
                  params: { url: product.demoUrl },
                })
              : null
          }
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-slate-700 py-3.5 active:opacity-80"
        >
          <Eye size={18} color="#F8FAFC" />
          <Text className="text-sm font-semibold text-white">试用</Text>
        </Pressable>
        <Pressable
          onPress={() => purchase.mutate()}
          disabled={purchase.isPending}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-lynx-500 py-3.5 active:opacity-80 disabled:opacity-40"
        >
          <ShoppingCart size={18} color="#FFFFFF" />
          <Text className="text-sm font-semibold text-white">
            {purchase.isPending ? '处理中…' : '购买'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
