import { Pressable, ScrollView, Text, View, Linking } from 'react-native';
import { Info, ExternalLink } from 'lucide-react-native';

const APP_VERSION = '0.1.0';
const UPDATE_URL = 'http://47.119.185.135:8090/lynxkit/';

const TECH_STACK = [
  { category: '移动端', items: ['Expo SDK 52', 'React Native', 'TypeScript', 'NativeWind'] },
  { category: '桌面端', items: ['Electron 30', 'Vite 5', 'React 19'] },
  { category: '后端', items: ['Hono', 'Node.js', 'PostgreSQL', 'Drizzle ORM'] },
  { category: 'Agent', items: ['9 层 Agent 流水线', 'AI SDK', 'SSE 流式'] },
];

export default function AboutScreen() {
  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerClassName="px-4 py-4 gap-4">
      <View className="flex-row items-center gap-2">
        <Info size={22} color="#FF6B35" />
        <Text className="text-xl font-bold text-white">关于 LynxKit</Text>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text className="text-lg font-bold text-white">LynxKit</Text>
            <Text className="text-xs text-slate-400">AI 全栈构建平台</Text>
          </View>
          <View className="rounded-full bg-lynx-500/20 px-3 py-1">
            <Text className="text-sm font-semibold text-lynx-500">v{APP_VERSION}</Text>
          </View>
        </View>
        <Text className="text-sm leading-5 text-slate-400">
          LynxKit 是一个 AI 驱动的全栈应用构建平台，通过 9 层 Agent 流水线，将自然语言描述转化为可部署的完整产品。
        </Text>
        <Pressable
          onPress={() => Linking.openURL(UPDATE_URL)}
          className="flex-row items-center justify-center gap-2 rounded-xl bg-slate-700 py-3 active:opacity-80"
        >
          <ExternalLink size={16} color="#F8FAFC" />
          <Text className="text-sm font-medium text-white">检查更新</Text>
        </Pressable>
      </View>

      <View className="gap-3 rounded-2xl bg-slate-800 p-4">
        <Text className="text-sm font-semibold text-slate-200">技术栈</Text>
        {TECH_STACK.map((tech) => (
          <View key={tech.category} className="gap-1.5">
            <Text className="text-xs font-medium text-slate-400">{tech.category}</Text>
            <View className="flex-row flex-wrap gap-1.5">
              {tech.items.map((item) => (
                <View key={item} className="rounded-full bg-slate-700 px-2.5 py-1">
                  <Text className="text-xs text-slate-300">{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
