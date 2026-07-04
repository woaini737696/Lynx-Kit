import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Star, Eye, ShoppingCart, ArrowLeft, Github } from 'lucide-react-native';
import { storeApi } from '../../src/lib/api';
import * as Haptics from 'expo-haptics';

export default function ProductDetailScreen() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  const id = Array.isArray(productId) ? productId[0] : productId;
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';
  const subtleIcon = isDark ? '#A1A1AA' : '#71717A';
  const backIcon = isDark ? '#FAFAFA' : '#3F3F46';

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
      <View className="flex-1 items-center justify-center bg-ink-100 dark:bg-ink-950">
        <Text className="text-ink-500 dark:text-ink-400">加载中…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-100 dark:bg-ink-950">
      <ScrollView contentContainerClassName="px-4 pb-6 pt-4 gap-5">
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <View className="h-10 w-10 items-center justify-center rounded-full border border-ink-200/60 bg-white/70 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
            <ArrowLeft size={18} color={backIcon} />
          </View>
        </Pressable>

        {/* 封面：优先使用 coverUrl，否则纯黑占位 */}
        {product.coverUrl ? (
          <Image
            source={{ uri: product.coverUrl }}
            className="h-44 rounded-3xl"
            resizeMode="cover"
          />
        ) : (
          <View className="h-44 items-center justify-center rounded-3xl bg-ink-950 dark:bg-ink-100">
            <Text className="text-5xl">📦</Text>
          </View>
        )}

        {/* 标题 + 评分 + 价格 */}
        <View className="gap-2 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 text-xl font-bold text-ink-900 dark:text-ink-50">
              {product.name}
            </Text>
            <View className="rounded-full border border-ink-300 bg-transparent px-2 py-0.5 dark:border-ink-700">
              <Text className="text-xs text-ink-600 dark:text-ink-300">
                v{product.version}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <View className="flex-row items-center gap-1">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-sm text-ink-700 dark:text-ink-300">
                {product.ratingAvg.toFixed(1)} · {product.ratingCount} 评价
              </Text>
            </View>
            <Text className="text-sm text-ink-500 dark:text-ink-400">
              {product.downloadCount} 次下载
            </Text>
          </View>
          <Text className="text-2xl font-bold text-ink-950 dark:text-ink-50">
            {product.price === 0
              ? '免费'
              : `¥${(product.price / 100).toFixed(2)}`}
          </Text>
        </View>

        {/* 产品介绍 */}
        <View className="gap-2 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
            产品介绍
          </Text>
          <Text className="text-sm leading-5 text-ink-600 dark:text-ink-300">
            {product.description}
          </Text>
          {product.tags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2 pt-1">
              {product.tags.map((t) => (
                <View
                  key={t}
                  className="rounded-full border border-ink-300 bg-transparent px-2.5 py-1 dark:border-ink-700"
                >
                  <Text className="text-xs text-ink-700 dark:text-ink-300">
                    {t}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* 查看源码（如有） */}
        {product.repoUrl ? (
          <Pressable
            onPress={() => Linking.openURL(product.repoUrl!)}
            className="flex-row items-center gap-2 self-start rounded-full border border-ink-300 bg-transparent px-4 py-2 active:opacity-80 dark:border-ink-700"
          >
            <Github size={16} color={subtleIcon} />
            <Text className="text-sm font-medium text-ink-950 dark:text-ink-50">
              查看源码
            </Text>
          </Pressable>
        ) : null}

        {/* 用户评价 */}
        <View className="gap-2 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <Text className="text-base font-semibold text-ink-900 dark:text-ink-50">
            用户评价
          </Text>
          {(reviews ?? []).length === 0 ? (
            <Text className="text-sm text-ink-500 dark:text-ink-400">
              暂无评价
            </Text>
          ) : (
            (reviews ?? []).map((r) => (
              <View
                key={r.id}
                className="gap-1 rounded-2xl bg-ink-100 p-3 dark:bg-ink-800"
              >
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={12} color="#F59E0B" fill="#F59E0B" />
                  ))}
                  {r.verified ? (
                    <Text className="ml-auto text-[10px] text-green-600 dark:text-green-400">
                      已购买
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm text-ink-700 dark:text-ink-300">
                  {r.content}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* 底部操作栏：毛玻璃 */}
      <View className="flex-row gap-3 border-t border-ink-200/60 bg-white/70 px-4 py-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
        <Pressable
          onPress={() =>
            product.demoUrl
              ? router.push({
                  pathname: '/build/preview',
                  params: { url: product.demoUrl },
                })
              : null
          }
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full border border-ink-300 bg-transparent py-3.5 active:opacity-80 dark:border-ink-700"
        >
          <Eye size={18} color={subtleIcon} />
          <Text className="text-sm font-semibold text-ink-950 dark:text-ink-50">
            试用
          </Text>
        </Pressable>
        <Pressable
          onPress={() => purchase.mutate()}
          disabled={purchase.isPending}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-full bg-ink-950 py-3.5 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
        >
          <ShoppingCart size={18} color={emphasisIcon} />
          <Text className="text-sm font-semibold text-ink-0 dark:text-ink-950">
            {purchase.isPending ? '处理中…' : '购买'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
