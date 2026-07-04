import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AuthLayout() {
  const colorScheme = useColorScheme();
  // 与登录/注册页背景对齐，避免路由切换瞬间出现深色闪烁
  const backgroundColor = colorScheme === 'dark' ? '#09090B' : '#F5F5F7';

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
