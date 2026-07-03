import { useEffect, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
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

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-4 gap-3">
      <View className="flex-row items-center gap-2 pb-2">
        <Bell size={22} color="#FF6B35" />
        <Text className="text-xl font-bold text-white">通知设置</Text>
      </View>
      {PREF_META.map((p) => (
        <View key={p.key} className="flex-row items-center justify-between rounded-2xl bg-slate-800 px-4 py-4">
          <View className="flex-1 pr-3">
            <Text className="text-base font-medium text-slate-100">{p.title}</Text>
            <Text className="text-xs text-slate-400 mt-0.5">{p.desc}</Text>
          </View>
          <Switch
            value={prefs[p.key]}
            onValueChange={() => toggle(p.key)}
            trackColor={{ false: '#334155', true: '#FF6B35' }}
            thumbColor={prefs[p.key] ? '#FFFFFF' : '#64748B'}
          />
        </View>
      ))}
    </ScrollView>
  );
}
