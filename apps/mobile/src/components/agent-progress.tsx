import { View, Text } from 'react-native';
import { CheckCircle2, Loader2, Circle } from 'lucide-react-native';
import type { AgentMeta } from '@lynxkit/shared';

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'failed';

interface AgentProgressProps {
  agents: AgentMeta[];
  statuses: Record<string, AgentStepStatus>;
}

/** 9 层 Agent 进度卡片 —— 毛玻璃行 + 状态语义色 */
export function AgentProgress({ agents, statuses }: AgentProgressProps) {
  return (
    <View className="gap-2">
      {agents.map((agent) => {
        const status = statuses[agent.id] ?? 'pending';
        return (
          <View
            key={agent.id}
            className={`flex-row items-center gap-3 rounded-2xl border px-3 py-3 backdrop-blur-xl ${
              status === 'running'
                ? 'border-ink-950/20 bg-ink-950/5 dark:border-ink-50/20 dark:bg-ink-50/5'
                : status === 'failed'
                  ? 'border-red-500/30 bg-red-500/5'
                  : 'border-white/70 bg-white/70 dark:border-ink-800/60 dark:bg-ink-900/70'
            }`}
          >
            <StatusIcon status={status} />
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                  {agent.step}. {agent.name}
                </Text>
                {agent.parallel ? (
                  <Text className="rounded-full border border-ink-300 bg-transparent px-1.5 py-0.5 text-[10px] text-ink-500 dark:border-ink-700 dark:text-ink-400">
                    并行
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-ink-500 dark:text-ink-400">
                {agent.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function StatusIcon({ status }: { status: AgentStepStatus }) {
  if (status === 'done') {
    return <CheckCircle2 size={20} color="#22C55E" />;
  }
  if (status === 'running') {
    return <Loader2 size={20} color="#09090B" />;
  }
  if (status === 'failed') {
    return <CheckCircle2 size={20} color="#EF4444" />;
  }
  return <Circle size={20} color="#A1A1AA" />;
}
