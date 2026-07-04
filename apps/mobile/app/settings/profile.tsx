import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../src/hooks/use-auth';
import { authApi } from '../../src/lib/api';
import {
  validateProfileForm,
  buildProfilePatch,
  type ProfileFormState,
  type ProfileFormErrors,
} from '../../src/lib/profile-form';

export default function ProfileEditScreen() {
  const { user, updateProfile } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form: ProfileFormState = { name, phone };

  const handleSave = async () => {
    setServerError(null);
    const newErrors = validateProfileForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const patch = buildProfilePatch(form, {
      name: user?.name,
      phone: user?.phone,
    });
    if (Object.keys(patch).length === 0) {
      setServerError('没有需要更新的字段');
      return;
    }

    setSaving(true);
    try {
      const updated = await authApi.updateProfile(patch);
      updateProfile({
        name: updated.name,
        phone: updated.phone,
        avatar: updated.avatar,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (e) {
      setServerError(e instanceof Error ? e.message : '保存失败');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-ink-100 dark:bg-ink-950"
    >
      <ScrollView
        contentContainerClassName="px-4 py-5 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* 头像预览：毛玻璃圆形容器 + 纯黑头像 */}
        <View className="items-center gap-2 pt-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
            <Text className="text-3xl font-bold text-ink-0 dark:text-ink-950">
              {(name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xs text-ink-500 dark:text-ink-400">
            头像取用户名首字母（暂不支持自定义）
          </Text>
        </View>

        {/* 表单卡片（毛玻璃） */}
        <View className="gap-4 rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
              用户名
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="输入用户名（2-32 字）"
              placeholderTextColor="#A1A1AA"
              maxLength={32}
              className="rounded-xl bg-ink-100 px-4 py-3.5 text-base text-ink-900 dark:bg-ink-800 dark:text-ink-50"
            />
            {errors.name ? (
              <Text className="text-xs text-red-500">{errors.name}</Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
              邮箱（不可修改）
            </Text>
            <TextInput
              value={user?.email ?? ''}
              editable={false}
              className="rounded-xl bg-ink-100/60 px-4 py-3.5 text-base text-ink-500 dark:bg-ink-800/60 dark:text-ink-400"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-ink-700 dark:text-ink-300">
              手机号
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="11 位手机号（可选）"
              placeholderTextColor="#A1A1AA"
              keyboardType="phone-pad"
              maxLength={11}
              className="rounded-xl bg-ink-100 px-4 py-3.5 text-base text-ink-900 dark:bg-ink-800 dark:text-ink-50"
            />
            {errors.phone ? (
              <Text className="text-xs text-red-500">{errors.phone}</Text>
            ) : null}
          </View>
        </View>

        {serverError ? (
          <Text className="text-center text-sm text-red-500">{serverError}</Text>
        ) : null}

        {/* 保存按钮：纯黑胶囊 */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-row items-center justify-center gap-2 rounded-full bg-ink-950 px-4 py-4 active:opacity-80 disabled:opacity-40 dark:bg-ink-100"
        >
          {saving ? (
            <ActivityIndicator size="small" color={isDark ? '#09090B' : '#FFFFFF'} />
          ) : null}
          <Text className="text-base font-semibold text-ink-0 dark:text-ink-950">
            {saving ? '保存中…' : '保存'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
