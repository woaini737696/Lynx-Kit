import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View, useColorScheme } from 'react-native';
import { Bell } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = 'lynxkit-notification-prefs';

const DEFAULT_PREFS = {
  buildCompleted: true,
  buildFailed: true,
  deploySuccess: true,
  productUpdates: false,
};

const PREF_META = [
  { key: 'buildCompleted', title: '构建完成通知', desc: '9 层 Agent 流水线跑完时提醒' },
  { key: 'buildFailed', title: '构建失败通知', desc: '任一 Agent 报错中断时提醒' },
  { key: 'deploySuccess', title: '部署成功通知', desc: '应用部署完成可访问时提醒' },
  { key: 'productUpdates', title: '产品更新通知', desc: '关注的商店产品更新时提醒' },
] as const;

type PrefKey = keyof typeof DEFAULT_PREFS;

export default function NotificationsScreen() {
  const isDark = useColorScheme() === 'dark';
  const emphasisIcon = isDark ? '#09090B' : '#FFFFFF';
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PREFS_KEY);
        if (saved) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      } catch {
        /* 读取失败忽略 */
      }
    })();
  }, []);

  const toggle = async (key: PrefKey) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    try {
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* 写入失败忽略 */
    }
  };

  // iOS Switch 在暗色下使用浅色 thumb 以匹配 ink-50 强调
  const trackOn = isDark ? '#FAFAFA' : '#09090B';
  const trackOff = isDark ? '#3F3F46' : '#D4D4D8';
  const thumbOn = isDark ? '#09090B' : '#FFFFFF';
  const thumbOff = isDark ? '#FAFAFA' : '#71717A';

  return (
    <ScrollView
      className="flex-1 bg-ink-100 dark:bg-ink-950"
      contentContainerClassName="px-4 py-4 gap-3"
    >
      {/* 标题：纯黑圆形图标 */}
      <View className="flex-row items-center gap-3 pb-2">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-ink-950 dark:bg-ink-100">
          <Bell size={18} color={emphasisIcon} />
        </View>
        <Text className="text-xl font-bold text-ink-900 dark:text-ink-50">
          通知设置
        </Text>
      </View>
      {PREF_META.map((p) => (
        <View
          key={p.key}
          className="flex-row items-center justify-between rounded-3xl border border-ink-200/60 bg-white/70 px-4 py-4 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-900/70"
        >
          <View className="flex-1 pr-3">
            <Text className="text-base font-medium text-ink-900 dark:text-ink-50">
              {p.title}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
              {p.desc}
            </Text>
          </View>
          <Switch
            value={prefs[p.key]}
            onValueChange={() => toggle(p.key)}
            trackColor={{ false: trackOff, true: trackOn }}
            thumbColor={prefs[p.key] ? thumbOn : thumbOff}
          />
        </View>
      ))}
    </ScrollView>
  );
}
