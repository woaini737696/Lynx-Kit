import { create } from "zustand";
import type {
  BuildSession,
  BuildStatus,
  AgentLog,
  AgentRole,
  ProductType,
  AIModelConfig,
} from "@lynxkit/shared";

interface BuildState {
  currentSession: BuildSession | null;
  sessions: BuildSession[];
  logs: AgentLog[];
  currentAgent: AgentRole | null;
  progress: number; // 0-100
  isBuilding: boolean;
  pendingInspiration: string; // 灵感输入框内容
  selectedProductType: ProductType | null;
  clarificationAnswers: Record<string, unknown>;
  selectedAIConfig: AIModelConfig | null;
  generatedFiles: Array<{ path: string; content: string; language: string }>;
  setInspiration: (text: string) => void;
  setProductType: (type: ProductType) => void;
  setAnswers: (answers: Record<string, unknown>) => void;
  setAIConfig: (cfg: AIModelConfig) => void;
  startBuild: (session: BuildSession) => void;
  updateStatus: (status: BuildStatus, progress?: number) => void;
  appendLog: (log: AgentLog) => void;
  setLogs: (logs: AgentLog[]) => void;
  setCurrentAgent: (agent: AgentRole | null) => void;
  setGeneratedFiles: (
    files: Array<{ path: string; content: string; language: string }>
  ) => void;
  reset: () => void;
}

export const useBuildStore = create<BuildState>()((set) => ({
  currentSession: null,
  sessions: [],
  logs: [],
  currentAgent: null,
  progress: 0,
  isBuilding: false,
  pendingInspiration: "",
  selectedProductType: null,
  clarificationAnswers: {},
  selectedAIConfig: null,
  generatedFiles: [],
  setInspiration: (text) => set({ pendingInspiration: text }),
  setProductType: (type) => set({ selectedProductType: type }),
  setAnswers: (answers) => set({ clarificationAnswers: answers }),
  setAIConfig: (cfg) => set({ selectedAIConfig: cfg }),
  startBuild: (session) =>
    set({ currentSession: session, isBuilding: true, logs: [], progress: 0 }),
  updateStatus: (status, progress) =>
    set((s) => ({
      currentSession: s.currentSession
        ? { ...s.currentSession, status }
        : null,
      progress: progress ?? s.progress,
    })),
  appendLog: (log) => set((s) => ({ logs: [...s.logs, log] })),
  setLogs: (logs) => set({ logs }),
  setCurrentAgent: (agent) => set({ currentAgent: agent }),
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  reset: () =>
    set({
      currentSession: null,
      logs: [],
      currentAgent: null,
      progress: 0,
      isBuilding: false,
      generatedFiles: [],
      clarificationAnswers: {},
    }),
}));
