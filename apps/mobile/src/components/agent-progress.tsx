import { View, Text } from 'react-native';
import { CheckCircle2, Loader2, Circle } from 'lucide-react-native';
import type { AgentMeta } from '@lynxkit/shared';

export type AgentStepStatus = 'pending' | 'running' | 'done' | 'failed';

interface AgentProgressProps {
  agents: AgentMeta[];
  statuses: Record<string, AgentStepStatus>;
}

/** 9 层 Agent 进度卡片 —— 展示流水线各步骤状态 */
export function AgentProgress({ agents, statuses }: AgentProgressProps) {
  return (
    <View className="gap-2">
      {agents.map((agent) => {
        const status = statuses[agent.id] ?? 'pending';
        return (
          <View
            key={agent.id}
            className={`flex-row items-center gap-3 rounded-xl border px-3 py-3 ${
              status === 'running'
                ? 'border-lynx-500 bg-lynx-500/10'
                : status === 'done'
                  ? 'border-slate-700 bg-slate-800/60'
                  : status === 'failed'
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-slate-800 bg-slate-900/40'
            }`}
          >
            <StatusIcon status={status} />
            <View className="flex-1 gap-0.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-semibold text-slate-100">
                  {agent.step}. {agent.name}
                </Text>
                {agent.parallel ? (
                  <Text className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] text-slate-300">
                    并行
                  </Text>
                ) : null}
              </View>
              <Text className="text-xs text-slate-400">{agent.description}</Text>
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
    return <Loader2 size={20} color="#FF6B35" />;
  }
  if (status === 'failed') {
    return <CheckCircle2 size={20} color="#EF4444" />;
  }
  return <Circle size={20} color="#475569" />;
}
