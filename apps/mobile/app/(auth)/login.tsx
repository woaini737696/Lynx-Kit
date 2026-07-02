import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/use-auth';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('请输入邮箱和密码');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-950"
    >
      <ScrollView contentContainerClassName="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-sm gap-6">
          <View className="items-center gap-2">
            <Text className="text-4xl">🦊</Text>
            <Text className="text-2xl font-bold text-white">LynxKit</Text>
            <Text className="text-sm text-slate-400">AI 全栈构建平台</Text>
          </View>

          <View className="gap-3">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="邮箱"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              className="rounded-xl bg-slate-800 px-4 py-3.5 text-base text-slate-100"
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="密码"
              placeholderTextColor="#64748B"
              secureTextEntry
              className="rounded-xl bg-slate-800 px-4 py-3.5 text-base text-slate-100"
            />
          </View>

          {error ? (
            <Text className="text-center text-sm text-red-400">{error}</Text>
          ) : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="items-center rounded-xl bg-lynx-500 px-4 py-4 active:opacity-80 disabled:opacity-40"
          >
            <Text className="text-base font-semibold text-white">
              {loading ? '登录中…' : '登录'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/register')}
            className="items-center py-2"
          >
            <Text className="text-sm text-slate-400">
              还没有账号？<Text className="text-lynx-500">立即注册</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
