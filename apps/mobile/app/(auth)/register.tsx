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
import {
  Check,
  ChevronLeft,
  Lock,
  Phone,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react-native';
import { authApi } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/use-auth';

/** 简易中国大陆手机号校验 */
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

interface PasswordStrength {
  score: 0 | 1 | 2 | 3;
  label: string;
}

/**
 * 密码强度评分：
 *   3 = 8 位 + 大写 + 数字（满足注册要求，强）
 *   2 = 8 位 + (大写 | 数字)，或 大写+数字但不足 8 位（中）
 *   1 = 其它（弱）
 *   0 = 空
 */
function getPasswordStrength(pw: string): PasswordStrength {
  if (!pw) return { score: 0, label: '' };
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const longEnough = pw.length >= 8;

  if (longEnough && hasUpper && hasDigit) {
    return { score: 3, label: '强' };
  }
  if ((longEnough && (hasUpper || hasDigit)) || (hasUpper && hasDigit)) {
    return { score: 2, label: '中' };
  }
  return { score: 1, label: '弱' };
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const insets = useSafeAreaInsets();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const strength = getPasswordStrength(password);

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
      Alert.alert('验证码发送失败', '请输入正确的手机号');
      return;
    }
    setSendingCode(true);
    try {
      await authApi.sendCode(phone, 'register');
      setCountdown(60);
    } catch (e) {
      Alert.alert(
        '验证码发送失败',
        e instanceof Error ? e.message : '验证码发送失败，请稍后重试',
      );
    } finally {
      setSendingCode(false);
    }
  };

  const handleRegister = async () => {
    if (!isValidPhone(phone)) {
      Alert.alert('注册失败', '请输入正确的手机号');
      return;
    }
    if (!code) {
      Alert.alert('注册失败', '请输入验证码');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      Alert.alert('注册失败', '密码需 8 位以上，包含大写字母和数字');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('注册失败', '两次输入的密码不一致');
      return;
    }
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      Alert.alert('注册失败', '昵称需 2-50 字符');
      return;
    }
    if (!agreed) {
      Alert.alert('注册失败', '请先同意服务条款');
      return;
    }

    setLoading(true);
    try {
      await register({
        phone,
        code,
        password,
        name: trimmedName,
      });
      router.replace('/');
    } catch (e) {
      Alert.alert(
        '注册失败',
        e instanceof Error ? e.message : '注册失败，请稍后重试',
      );
    } finally {
      setLoading(false);
    }
  };

  // 密码强度条颜色（灰阶，符合设计规范）
  const strengthBars = [1, 2, 3].map((i) => {
    if (strength.score >= i) {
      // 当前等级及以下点亮
      if (strength.score === 1) return 'bg-ink-400';
      if (strength.score === 2) return 'bg-ink-600';
      return 'bg-ink-950 dark:bg-ink-50';
    }
    return 'bg-ink-200 dark:bg-ink-800';
  });

  return (
    <View className="flex-1 bg-ink-100 dark:bg-ink-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          }}
          contentContainerClassName="px-6"
        >
          {/* 顶部栏：返回 + 标题 */}
          <View className="mb-8 flex-row items-center gap-3">
            <Pressable
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-ink-200/60 active:opacity-70 dark:bg-ink-900"
              hitSlop={8}
            >
              <ChevronLeft size={20} color="#3F3F46" />
            </Pressable>
            <View className="gap-1">
              <Text className="text-xl font-semibold text-ink-900 dark:text-ink-50">
                创建账号
              </Text>
              <Text className="text-sm text-ink-500 dark:text-ink-400">
                开启你的造物之旅
              </Text>
            </View>
          </View>

          {/* 表单卡片（毛玻璃） */}
          <View className="gap-5 rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-3xl dark:border-ink-800/60 dark:bg-ink-900/60">
            {/* 手机号 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                手机号
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <Phone size={18} color="#71717A" />
                <Text className="text-sm text-ink-500 dark:text-ink-400">+86</Text>
                <View className="h-5 w-px bg-ink-300 dark:bg-ink-700" />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="请输入手机号"
                  placeholderTextColor="#A1A1AA"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                />
              </View>
            </View>

            {/* 验证码 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                验证码
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <RefreshCw size={18} color="#71717A" />
                <TextInput
                  value={code}
                  onChangeText={setCode}
                  placeholder="请输入验证码"
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
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 密码 + 强度指示器 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                密码
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <Lock size={18} color="#71717A" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="8 位以上，含大写字母和数字"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry
                  autoCapitalize="none"
                  className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                />
              </View>
              {/* 强度指示器：3 条 */}
              {password.length > 0 ? (
                <View className="mt-2 flex-row items-center gap-2">
                  <View className="flex-1 flex-row gap-1.5">
                    {strengthBars.map((barClass, i) => (
                      <View
                        key={i}
                        className={`h-1 flex-1 rounded-full ${barClass}`}
                      />
                    ))}
                  </View>
                  <Text className="text-xs text-ink-500 dark:text-ink-400">
                    {strength.label}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* 确认密码 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                确认密码
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <Shield size={18} color="#71717A" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="请再次输入密码"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry
                  autoCapitalize="none"
                  className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                />
                {confirmPassword.length > 0 && confirmPassword === password ? (
                  <Check size={18} color="#09090B" />
                ) : null}
              </View>
            </View>

            {/* 昵称 */}
            <View className="gap-2">
              <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
                昵称
              </Text>
              <View className="flex-row items-center gap-2 rounded-xl bg-ink-100 px-4 dark:bg-ink-800">
                <User size={18} color="#71717A" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="2-50 字符"
                  placeholderTextColor="#A1A1AA"
                  maxLength={50}
                  className="flex-1 py-3.5 text-base text-ink-900 dark:text-ink-50"
                />
              </View>
            </View>

            {/* 服务条款 */}
            <Pressable
              onPress={() => setAgreed((v) => !v)}
              className="flex-row items-start gap-3 py-1"
            >
              <View
                className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
                  agreed
                    ? 'border-ink-950 bg-ink-950 dark:border-ink-50 dark:bg-ink-50'
                    : 'border-ink-300 bg-transparent dark:border-ink-700'
                }`}
              >
                {agreed ? <Check size={14} color="#FFFFFF" /> : null}
              </View>
              <Text className="flex-1 text-sm text-ink-500 dark:text-ink-400">
                我已阅读并同意
                <Text className="font-medium text-ink-950 dark:text-ink-50">
                  《服务条款》
                </Text>
                与
                <Text className="font-medium text-ink-950 dark:text-ink-50">
                  《隐私政策》
                </Text>
              </Text>
            </Pressable>
          </View>

          {/* 注册按钮 */}
          <Pressable
            onPress={handleRegister}
            disabled={loading}
            className="mt-6 items-center justify-center rounded-full bg-ink-950 px-6 py-4 active:opacity-80 disabled:opacity-40 dark:bg-ink-50"
          >
            <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
              {loading ? '注册中…' : '注册'}
            </Text>
          </Pressable>

          {/* 跳转登录 */}
          <Pressable
            onPress={() => router.back()}
            className="mt-8 items-center py-2"
          >
            <Text className="text-sm text-ink-500 dark:text-ink-400">
              已有账号？<Text className="font-medium text-ink-950 dark:text-ink-50">立即登录</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
