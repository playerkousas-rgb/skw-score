import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ContestMode = 'coloring' | 'design';

export type MetricType = 'creativity' | 'technical' | 'visual' | 'content' | 'impact' | 'theme' | 'completeness';

export const METRIC_TYPE_OPTIONS: { value: MetricType; label: string; desc: string }[] = [
  { value: 'creativity', label: '色彩創意', desc: '色彩豐富度、獨特色彩比例、邊緣複雜度' },
  { value: 'technical', label: '技術品質', desc: '解析度、長寬比、對比度、曝光' },
  { value: 'visual', label: '視覺平衡', desc: '亮度平衡、飽和度、色彩協調' },
  { value: 'content', label: '細節豐富度', desc: '邊緣密度、色域覆蓋率' },
  { value: 'impact', label: '視覺衝擊力', desc: '高對比 + 高色彩 + 高細節' },
  { value: 'theme', label: '綜合表現力', desc: '色彩 + 細節 + 多樣性 + 對比度' },
  { value: 'completeness', label: '均衡度', desc: '各項指標的平均表現' },
];

export interface CriterionDef {
  id: string;
  name: string;
  weight: number; // percentage, all weights should sum to 100
  description: string;
  metricType?: MetricType; // which pixel metric to use for scoring
}

export interface ContestConfig {
  mode: ContestMode;
  scoringMode: ScoringMode;
  theme: string;
  description: string;
  criteria: CriterionDef[];
}

export interface Submission {
  id: string;
  batchId?: string;
  contestConfig?: ContestConfig;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  status: 'pending' | 'scoring' | 'completed';
  score?: ScoreResult;
  thumbnail?: string;
  fullImage?: string;
}

export interface ScoreResult {
  totalScore: number;
  categories: {
    name: string;
    score: number;
    maxScore: number;
    feedback: string;
    weight?: number;
  }[];
  aiComment: string;
  suggestions: string[];
  strengths: string[];
  tags: string[];
}

interface AppState {
  submissions: Submission[];
  currentSubmission: Submission | null;
  isUploading: boolean;
  addSubmission: (sub: Submission) => void;
  addBatchSubmissions: (subs: Submission[]) => void;
  updateSubmission: (id: string, data: Partial<Submission>) => void;
  setCurrentSubmission: (sub: Submission | null) => void;
  setIsUploading: (val: boolean) => void;
  clearAllSubmissions: () => void;
  clearBatch: (batchId: string) => void;
}

export type ScoringMode = 'ai' | 'custom';

export const MAX_FILES = 100;

export const DEFAULT_COLORING_CRITERIA: CriterionDef[] = [
  { id: 'creativity', name: '創意與原創性', weight: 25, description: '色彩運用的創意程度與獨特性' },
  { id: 'technical', name: '技術執行力', weight: 20, description: '解析度、對比度、整體技術品質' },
  { id: 'visual', name: '視覺呈現', weight: 25, description: '亮度平衡、飽和度、整體視覺效果' },
  { id: 'content', name: '內容深度', weight: 15, description: '畫面細節豐富度與色彩多樣性' },
  { id: 'completeness', name: '整體完整性', weight: 15, description: '各維度的均衡表現' },
];

export const DEFAULT_DESIGN_CRITERIA: CriterionDef[] = [
  { id: 'theme', name: '主題契合度', weight: 25, description: '作品與指定主題的相關性與詮釋深度' },
  { id: 'creativity', name: '創意與原創性', weight: 25, description: '設計概念的新穎度與獨特性' },
  { id: 'visual', name: '視覺設計', weight: 20, description: '配色、排版、構圖的美感與專業度' },
  { id: 'technical', name: '技術品質', weight: 10, description: '解析度、細節處理、完成度' },
  { id: 'impact', name: '整體影響力', weight: 20, description: '作品的感染力、記憶點與傳達效果' },
];

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      submissions: [],
      currentSubmission: null,
      isUploading: false,
      addSubmission: (sub) => set((s) => ({ submissions: [sub, ...s.submissions] })),
      addBatchSubmissions: (subs) => set((s) => ({ submissions: [...subs, ...s.submissions] })),
      updateSubmission: (id, data) =>
        set((s) => ({
          submissions: s.submissions.map((sub) => (sub.id === id ? { ...sub, ...data } : sub)),
          currentSubmission:
            s.currentSubmission?.id === id ? { ...s.currentSubmission, ...data } : s.currentSubmission,
        })),
      setCurrentSubmission: (sub) => set({ currentSubmission: sub }),
      setIsUploading: (val) => set({ isUploading: val }),
      clearAllSubmissions: () => set({ submissions: [], currentSubmission: null }),
      clearBatch: (batchId) => set((s) => ({
        submissions: s.submissions.filter((sub) => sub.batchId !== batchId),
        currentSubmission: s.currentSubmission?.batchId === batchId ? null : s.currentSubmission,
      })),
    }),
    {
      name: 'scoreai-storage',
      partialize: (state) => ({ submissions: state.submissions }),
    }
  )
);
