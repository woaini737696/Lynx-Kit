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
      className="flex-1 bg-slate-950"
    >
      <ScrollView
        contentContainerClassName="px-4 py-5 gap-5"
        keyboardShouldPersistTaps="handled"
      >
        {/* 头像预览 */}
        <View className="items-center gap-2 pt-2">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-lynx-500">
            <Text className="text-3xl font-bold text-white">
              {(name || user?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-xs text-slate-500">
            头像取用户名首字母（暂不支持自定义）
          </Text>
        </View>

        {/* 表单 */}
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-xs text-slate-400">用户名</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="输入用户名（2-32 字）"
              placeholderTextColor="#64748B"
              maxLength={32}
              className="rounded-xl bg-slate-800 px-4 py-3.5 text-base text-slate-100"
            />
            {errors.name ? (
              <Text className="text-xs text-red-400">{errors.name}</Text>
            ) : null}
          </View>

          <View className="gap-1.5">
            <Text className="text-xs text-slate-400">邮箱（不可修改）</Text>
            <TextInput
              value={user?.email ?? ''}
              editable={false}
              className="rounded-xl bg-slate-800/50 px-4 py-3.5 text-base text-slate-500"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-xs text-slate-400">手机号</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="11 位手机号（可选）"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              maxLength={11}
              className="rounded-xl bg-slate-800 px-4 py-3.5 text-base text-slate-100"
            />
            {errors.phone ? (
              <Text className="text-xs text-red-400">{errors.phone}</Text>
            ) : null}
          </View>
        </View>

        {serverError ? (
          <Text className="text-center text-sm text-red-400">{serverError}</Text>
        ) : null}

        {/* 保存按钮 */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-lynx-500 px-4 py-4 active:opacity-80 disabled:opacity-40"
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : null}
          <Text className="text-base font-semibold text-white">
            {saving ? '保存中…' : '保存'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
