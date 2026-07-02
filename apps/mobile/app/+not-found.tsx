import { Link, Stack } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Home } from 'lucide-react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '找不到页面', headerShown: true, headerTintColor: '#F8FAFC', headerStyle: { backgroundColor: '#0F172A' } }} />
      <View className="flex-1 items-center justify-center gap-4 bg-slate-950 px-8">
        <Text className="text-6xl font-bold text-slate-700">404</Text>
        <Text className="text-base text-slate-300">页面不存在</Text>
        <Link href="/(tabs)/home" asChild>
          <Pressable className="flex-row items-center gap-2 rounded-full bg-lynx-500 px-5 py-2.5">
            <Home size={16} color="#FFFFFF" />
            <Text className="text-sm font-semibold text-white">返回首页</Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
