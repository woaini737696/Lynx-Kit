import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Lock, Phone, RefreshCw } from 'lucide-react-native';
import { authApi } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/use-auth';

type LoginTab = 'password' | 'code';

/** 简易中国大陆手机号校验 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login, loginByCode } = useAuth();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<LoginTab>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 60s 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert(t('auth.loginFailed'), '请输入正确的手机号');
      return;
    }
    setSendingCode(true);
    try {
      await authApi.sendCode(phone, 'login');
      setCountdown(60);
    } catch (e) {
      Alert.alert(
        t('auth.loginFailed'),
        e instanceof Error ? e.message : '验证码发送失败',
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleLogin = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert(t('auth.loginFailed'), '请输入正确的手机号');
      return;
    }
    if (tab === 'password' && !password) {
      Alert.alert(t('auth.loginFailed'), t('auth.passwordPlaceholder'));
      return;
    }
    if (tab === 'code' && !code) {
      Alert.alert(t('auth.loginFailed'), t('auth.code'));
      return;
    }

    setLoading(true);
    try {
      if (tab === 'password') {
        await login(phone, password);
      } else {
        await loginByCode(phone, code);
      }
      router.replace('/');
    } catch (e) {
      Alert.alert(
        t('auth.loginFailed'),
        e instanceof Error ? e.message : t('auth.loginFailed'),
      );
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: LoginTab; label: string }[] = [
    { key: 'password', label: '密码登录' },
    { key: 'code', label: '验证码登录' },
  ];

  return (
    <View className="flex-1 bg-ink-100 dark:bg-ink-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 24,
          }}
          contentContainerClassName="px-6"
        >
          {/* 品牌区 */}
          <View className="mb-10 items-center gap-3">
            <View className="h-16 w-16 items-center justify-center rounded-3xl bg-ink-950 dark:bg-ink-50">
              <Text className="text-3xl">🦊</Text>
            </View>
            <View className="items-center gap-1">
              <Text className="text-xl font-semibold text-ink-900 dark:text-ink-50">
                {t('common.brand')}
              </Text>
              <Text className="text-sm text-ink-500 dark:text-ink-400">
                {t('auth.loginSubtitle')}
              </Text>
            </View>
          </View>

          {/* Tab 切换 */}
          <View className="mb-6 flex-row rounded-full bg-ink-200/60 p-1 dark:bg-ink-900">
            {tabs.map(({ key, label }) => {
              const active = tab === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setTab(key)}
                  className={`flex-1 items-center rounded-full py-2.5 ${
                    active ? 'bg-ink-950 dark:bg-ink-50' : 'bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      active
                        ? 'text-ink-0 dark:text-ink-950'
                        : 'text-ink-500 dark:text-ink-400'
                    }`}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* 表单卡片（毛玻璃） */}
          <View className="gap-4 rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-3xl dark:border-ink-800/60 dark:bg-ink-900/60">
            {/* 手机号 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                {t('auth.phone')}
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <Phone size={18} color="#71717A" />
                <Text className="text-sm text-ink-500 dark:text-ink-400">+86</Text>
                <View className="h-5 w-px bg-ink-300 dark:bg-ink-700" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder={t('auth.phone')}
                  placeholderTextColor="#A1A1AA"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                />
              </View>
            </View>

            {/* 密码 / 验证码 */}
            {tab === 'password' ? (
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                  {t('auth.password')}
                </Text>
                <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                  <Lock size={18} color="#71717A" />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder={t('auth.passwordPlaceholder')}
                    placeholderTextColor="#A1A1AA"
                    secureTextEntry
                    className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                  />
                </View>
              </View>
            ) : (
              <View className="gap-2">
                <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                  {t('auth.code')}
                </Text>
                <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                  <RefreshCw size={18} color="#71717A" />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder={t('auth.code')}
                    placeholderTextColor="#A1A1AA"
                    keyboardType="number-pad"
                    className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                  />
                  <Pressable
                    onPress={handleSendCode}
                    disabled={countdown > 0 || sendingCode || !isValidPhone(phone)}
                    className="rounded-full px-3 py-1.5 active:opacity-70 disabled:opacity-40"
                  >
                    <Text className="text-sm font-medium text-ink-950 dark:text-ink-50">
                      {countdown > 0 ? `${countdown}s` : t('auth.sendCode')}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* 登录按钮 */}
          <Pressable
            onPress={handleLogin}
            disabled={loading}
            className="mt-6 flex-row items-center justify-center gap-2 rounded-full bg-ink-950 px-6 py-4 active:opacity-80 disabled:opacity-40 dark:bg-ink-50"
          >
            <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
              {loading ? t('auth.loginLoading') : t('auth.loginButton')}
            </Text>
            {!loading ? (
              <ChevronRight size={18} color="#FFFFFF" />
            ) : null}
          </Pressable>

          {/* 跳转注册 */}
          <Pressable
            onPress={() => router.push('/(auth)/register')}
            className="mt-8 items-center py-2"
          >
            <Text className="text-sm text-ink-500 dark:text-ink-400">
              {t('auth.noAccount')}
              <Text className="font-medium text-ink-950 dark:text-ink-50">
                {t('auth.registerNow')}
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
