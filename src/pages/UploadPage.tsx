import { useCallback, useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDropzone, type FileRejection } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Sparkles, CheckCircle2, Loader2,
  Images, Palette, PenTool, ArrowRight, ArrowLeft, Plus, Trash2, GripVertical,
  AlertCircle, Cpu, SlidersHorizontal,
} from 'lucide-react';
import {
  useAppStore, type Submission, type ContestConfig, type CriterionDef, type ContestMode, type ScoringMode, type ScoringEngine,
  DEFAULT_COLORING_CRITERIA, DEFAULT_DESIGN_CRITERIA, MAX_FILES, METRIC_TYPE_OPTIONS, type MetricType,
} from '../store/appStore';
import { analyzeWithGPT4o } from "../lib/gptAnalyzer";
import { KeyRound } from 'lucide-react';
import { analyzeFile, generateThumbnail, generateFullImage } from '../lib/analyzer';

interface FileWithPreview { file: File; preview?: string; }
interface ScoringFile {
  file: File;
  status: 'waiting' | 'analyzing' | 'done' | 'error';
  preview?: string;
  score?: number;
  error?: string;
}
type Step = 'setup' | 'upload' | 'scoring';
const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

export default function UploadPage() {
  const navigate = useNavigate();
  const { addBatchSubmissions, openAiApiKey, setOpenAiApiKey } = useAppStore();
  const [step, setStep] = useState<Step>('setup');

  // Contest config
  const [mode, setMode] = useState<ContestMode>('coloring');
  const [scoringMode, setScoringMode] = useState<ScoringMode>('ai');
  const [scoringEngine, setScoringEngine] = useState<ScoringEngine>('local');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [criteria, setCriteria] = useState<CriterionDef[]>(DEFAULT_COLORING_CRITERIA);

  // Upload state
  const [filesWithPreview, setFilesWithPreview] = useState<FileWithPreview[]>([]);
  const [scoringFiles, setScoringFiles] = useState<ScoringFile[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const handleModeChange = (nextMode: ContestMode) => {
    setMode(nextMode);
    if (scoringMode === 'ai') {
      setCriteria(nextMode === 'coloring' ? DEFAULT_COLORING_CRITERIA : DEFAULT_DESIGN_CRITERIA);
    }
  };

  const handleScoringModeChange = (nextMode: ScoringMode) => {
    setScoringMode(nextMode);
    if (nextMode === 'ai') {
      setCriteria(mode === 'coloring' ? DEFAULT_COLORING_CRITERIA : DEFAULT_DESIGN_CRITERIA);
    } else if (criteria.length === 0) {
      setCriteria(mode === 'coloring' ? DEFAULT_COLORING_CRITERIA : DEFAULT_DESIGN_CRITERIA);
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    let hasDuplicates = false;
    let reachedLimit = false;
    setFilesWithPreview((prev) => {
      const existingKeys = new Set(prev.map(({ file }) => `${file.name}-${file.size}-${file.lastModified}`));
      const uniqueFiles = accepted.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        if (existingKeys.has(key)) return false;
        existingKeys.add(key);
        return true;
      });

      hasDuplicates = uniqueFiles.length !== accepted.length;

      const newFiles: FileWithPreview[] = uniqueFiles.map((file) => {
        const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
        if (preview) previewUrlsRef.current.add(preview);
        return { file, preview };
      });
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES) {
        combined.slice(MAX_FILES).forEach((f) => {
          if (f.preview) {
            URL.revokeObjectURL(f.preview);
            previewUrlsRef.current.delete(f.preview);
          }
        });
        reachedLimit = true;
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
    if (reachedLimit) setUploadNotice(`最多只能上傳 ${MAX_FILES} 個檔案`);
    else if (hasDuplicates) setUploadNotice('已略過重複檔案');
  }, []);

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0]?.message;
    setUploadNotice(firstError ? `部分檔案未加入：${firstError}` : '部分檔案未能加入，請確認檔案大小。');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    multiple: true,
    maxSize: MAX_UPLOAD_SIZE,
  });

  const removeFile = (idx: number) => {
    setFilesWithPreview((prev) => {
      const removed = prev[idx];
      if (removed.preview) {
        URL.revokeObjectURL(removed.preview);
        previewUrlsRef.current.delete(removed.preview);
      }
      return prev.filter((_, i) => i !== idx);
    });
  };

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);

  const addCriterion = () => {
    if (criteria.length >= 10) return;
    setCriteria([...criteria, { id: `custom-${Date.now()}`, name: '', weight: 0, description: '' }]);
  };
  const removeCriterion = (idx: number) => {
    if (criteria.length <= 2) return;
    setCriteria(criteria.filter((_, i) => i !== idx));
  };
  const updateCriterion = (idx: number, field: keyof CriterionDef, value: string | number) => {
    setCriteria(criteria.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const contestConfig: ContestConfig = { mode, scoringMode, theme, description, criteria };

  const canProceed = () => {
    if (mode === 'design' && !theme.trim()) return false;
    if (scoringMode === 'custom') {
      const validCriteria = criteria.filter((c) => c.name.trim());
      if (validCriteria.length < 2) return false;
      if (totalWeight !== 100) return false;
    }
    return true;
  };

  const startBatchScoring = async () => {
    if (scoringEngine === 'gpt4o' && !openAiApiKey) {
      setScoringError('請先輸入 OpenAI API Key，才能使用 GPT-4o 引擎。');
      return;
    }
    if (filesWithPreview.length === 0) return;

    setStep('scoring');
    setCompletedCount(0);
    setScoringError(null);

    const finalConfig: ContestConfig = {
      ...contestConfig,
      scoringEngine,
      criteria: scoringMode === 'custom'
        ? criteria.filter((c) => c.name.trim())
        : criteria,
    };

    const initial: ScoringFile[] = filesWithPreview.map((f) => ({
      file: f.file, status: 'waiting' as const, preview: f.preview,
    }));
    setScoringFiles(initial);

    const batchId = 'batch-' + Date.now();
    const results: Submission[] = [];
    let failedCount = 0;

    // Process in parallel batches of three. Promise.allSettled prevents one
    // broken file (or one failed API request) from blocking every other file.
    const BATCH_SIZE = 3;
    for (let i = 0; i < initial.length; i += BATCH_SIZE) {
      const chunk = initial.slice(i, i + BATCH_SIZE);
      const chunkIndices = chunk.map((_, j) => i + j);

      setScoringFiles((prev) => prev.map((sf, j) =>
        chunkIndices.includes(j) ? { ...sf, status: 'analyzing', error: undefined } : sf
      ));

      const chunkResults = await Promise.allSettled(
        chunk.map(async (sf, j) => {
          const idx = i + j;
          const [scoreResult, thumbnail, fullImage] = await Promise.all([
            scoringEngine === 'gpt4o'
              ? analyzeWithGPT4o(sf.file, finalConfig, openAiApiKey)
              : analyzeFile(sf.file, finalConfig),
            generateThumbnail(sf.file),
            generateFullImage(sf.file),
          ]);
          return { idx, scoreResult, thumbnail, fullImage, file: sf.file };
        })
      );

      chunkResults.forEach((outcome, j) => {
        const idx = i + j;
        if (outcome.status === 'rejected') {
          failedCount += 1;
          const message = outcome.reason instanceof Error ? outcome.reason.message : '檔案分析失敗';
          setScoringFiles((prev) => prev.map((sf, fileIndex) =>
            fileIndex === idx ? { ...sf, status: 'error', error: message } : sf
          ));
          return;
        }

        const { scoreResult, thumbnail, fullImage, file } = outcome.value;
        results.push({
          id: `sub-${batchId}-${idx}`,
          batchId,
          contestConfig: finalConfig,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          uploadedAt: new Date().toISOString(),
          status: 'completed',
          score: scoreResult,
          thumbnail,
          fullImage,
        });
        setScoringFiles((prev) => prev.map((sf, fileIndex) =>
          fileIndex === idx ? { ...sf, status: 'done', score: scoreResult.totalScore } : sf
        ));
      });

      setCompletedCount(Math.min(i + BATCH_SIZE, initial.length));
    }

    if (results.length > 0) addBatchSubmissions(results);

    if (failedCount > 0) {
      setScoringError(
        results.length > 0
          ? `${failedCount} 個檔案分析失敗，已保存 ${results.length} 個成功結果。`
          : '所有檔案都分析失敗，請確認檔案格式或評分引擎設定後重試。'
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    if (results.length === 1) navigate(`/result/${results[0].id}`);
    else navigate(`/compare/${batchId}`);
  };

  const totalFiles = filesWithPreview.length;
  const stepLabels = ['比賽設定', '上傳作品', '評分中'];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['setup', 'upload', 'scoring'] as Step[]).map((s, i) => {
            const stepIdx = ['setup', 'upload', 'scoring'].indexOf(step);
            return (
              <div key={s} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'gradient-bg text-white shadow-lg shadow-primary/25'
                    : stepIdx > i ? 'bg-success text-white'
                    : 'bg-navy-light/60 text-muted'
                  }`}>
                    {stepIdx > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] text-muted">{stepLabels[i]}</span>
                </div>
                {i < 2 && <div className={`w-10 h-0.5 rounded mb-4 ${stepIdx > i ? 'bg-success' : 'bg-navy-light/60'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Contest Setup ─── */}
          {step === 'setup' && (
            <motion.div key="setup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">比賽<span className="gradient-text">設定</span></h1>
                <p className="text-muted">選擇比賽類型、評分模式與評分標準</p>
              </div>

              {/* Mode Selection */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {([
                  { id: 'coloring' as ContestMode, icon: Palette, title: '🎨 填色比賽', desc: '基於像素指標的色彩與技術評分' },
                  { id: 'design' as ContestMode, icon: PenTool, title: '✏️ 設計比賽', desc: '可設定主題，適合創意設計評比' },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleModeChange(m.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                      mode === m.id ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${mode === m.id ? 'gradient-bg shadow-lg shadow-primary/20' : 'bg-navy-light'}`}>
                      <m.icon className={`w-5 h-5 ${mode === m.id ? 'text-white' : 'text-muted'}`} />
                    </div>
                    <div className="font-bold text-sm mb-1">{m.title}</div>
                    <div className="text-xs text-muted">{m.desc}</div>
                  </button>
                ))}
              </div>

              {/* Scoring Mode Toggle */}
              <div className="bg-card rounded-2xl border border-border p-5 mb-6">
                <h3 className="font-bold text-sm mb-3">評分模式</h3>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { id: 'ai' as ScoringMode, icon: Cpu, title: '預設評分標準', desc: '使用預設的五維度評分標準' },
                    { id: 'custom' as ScoringMode, icon: SlidersHorizontal, title: '自定義評分', desc: '自訂評分項目、權重與佔比' },
                  ] as const).map((sm) => (
                    <button
                      key={sm.id}
                      onClick={() => handleScoringModeChange(sm.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        scoringMode === sm.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/20 bg-background'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <sm.icon className={`w-4 h-4 ${scoringMode === sm.id ? 'text-primary' : 'text-muted'}`} />
                        <span className={`text-sm font-bold ${scoringMode === sm.id ? 'text-primary' : ''}`}>{sm.title}</span>
                      </div>
                      <div className="text-[11px] text-muted">{sm.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Design mode: Theme */}
              {mode === 'design' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-accent" />
                      比賽主題 <span className="text-danger text-xs">*</span>
                    </h3>
                    <input
                      type="text"
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                      placeholder="例如：未來城市、環保生活、太空探索..."
                      className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                    />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="比賽說明（選填）：描述比賽要求、期望風格、注意事項等..."
                      rows={2}
                      className="w-full mt-3 px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {/* Criteria Editor — only for custom mode */}
              {scoringMode === 'custom' ? (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                  <div className="bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-sm flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-primary" />
                        自定義評分項目
                        <span className="text-xs text-muted font-normal">（{criteria.length}/10）</span>
                      </h3>
                      <button onClick={addCriterion} disabled={criteria.length >= 10} className="text-xs font-medium text-primary hover:underline disabled:text-muted flex items-center gap-1">
                        <Plus className="w-3 h-3" /> 新增
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {criteria.map((c, i) => (
                        <div key={c.id} className="flex items-start gap-2 p-3 rounded-xl bg-background border border-border">
                          <GripVertical className="w-4 h-4 text-muted mt-2.5 flex-shrink-0 opacity-30" />
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2 items-center flex-wrap">
                              <input
                                type="text"
                                value={c.name}
                                onChange={(e) => updateCriterion(i, 'name', e.target.value)}
                                placeholder="評分項目名稱"
                                className="flex-1 min-w-[120px] px-3 py-2 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                              />
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={c.weight}
                                  onChange={(e) => updateCriterion(i, 'weight', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                                  className="w-16 px-2 py-2 rounded-lg bg-card border border-border text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                <span className="text-xs font-semibold text-muted">%</span>
                              </div>
                            </div>
                            <div className="flex gap-2 items-center">
                              <select
                                value={c.metricType || 'visual'}
                                onChange={(e) => updateCriterion(i, 'metricType', e.target.value as MetricType)}
                                className="flex-1 px-2 py-1.5 rounded-lg bg-card border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary/20"
                              >
                                {METRIC_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                                ))}
                              </select>
                            </div>
                            <input
                              type="text"
                              value={c.description}
                              onChange={(e) => updateCriterion(i, 'description', e.target.value)}
                              placeholder="補充說明（選填）..."
                              className="w-full px-3 py-1.5 rounded-lg bg-card border border-border text-xs text-muted focus:outline-none focus:ring-1 focus:ring-primary/20"
                            />
                          </div>
                          <button onClick={() => removeCriterion(i)} disabled={criteria.length <= 2} className="p-1 rounded hover:bg-red-50 text-muted hover:text-danger transition-colors disabled:opacity-30 mt-2">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    {/* Weight summary */}
                    <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs font-semibold ${
                      totalWeight === 100 ? 'border-success/30 text-success' : 'border-danger/30 text-danger'
                    }`}>
                      <span>佔比總計：{totalWeight}%{totalWeight !== 100 && `（需為 100%）`}</span>
                      <span className="text-muted font-normal">{criteria.filter((c) => c.name.trim()).length} 個有效項目</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* AI mode preview */
                <div className="bg-card rounded-2xl border border-border p-5 mb-6">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    AI 預設評分維度
                  </h3>
                  <div className="space-y-2">
                    {criteria.map((c) => (
                      <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-background border border-border">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold">{c.name}</div>
                          <div className="text-[10px] text-muted truncate">{c.description}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-navy-light/60 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${c.weight}%` }} />
                          </div>
                          <span className="text-xs font-bold text-primary w-10 text-right">{c.weight}%</span>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-muted text-right pt-1">佔比總計：{criteria.reduce((s, c) => s + c.weight, 0)}%</div>
                  </div>
                </div>
              )}

              
              {/* Engine Selection */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <h3 className="font-bold text-sm mb-3">選擇評分引擎</h3>
                <div className="grid sm:grid-cols-2 gap-3 mb-4">
                  {[
                    { id: 'local', icon: Cpu, title: '本地客觀分析', desc: '基於可量化像素指標，速度快且免費；不判斷主題語意' },
                    { id: 'gpt4o', icon: Sparkles, title: 'GPT-4o Vision', desc: '固定評分錨點、逐項引用證據，適合主題與創意判斷' },
                  ].map((eng) => (
                    <button
                      key={eng.id}
                      onClick={() => setScoringEngine(eng.id as ScoringEngine)}
                      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${scoringEngine === eng.id ? 'bg-primary/10 border-primary shadow-sm shadow-primary/10' : 'bg-card border-border hover:border-primary/50'}`}
                    >
                      <eng.icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${scoringEngine === eng.id ? 'text-primary' : 'text-muted'}`} />
                      <div>
                        <div className={`text-sm font-bold ${scoringEngine === eng.id ? 'text-primary' : 'text-foreground'}`}>{eng.title}</div>
                        <div className="text-xs text-muted mt-1">{eng.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {scoringEngine === 'gpt4o' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <label className="block text-sm font-bold mb-2 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-primary" />
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        value={openAiApiKey}
                        onChange={(e) => setOpenAiApiKey(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <p className="text-xs text-muted mt-2">
                        您的 API Key 僅會儲存於本地瀏覽器中，並直接向 OpenAI 發送請求，我們不會伺服器端保存您的金鑰。
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {scoringError && (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3 text-sm text-danger" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {scoringError}
                </div>
              )}

            <button
              onClick={() => setStep('upload')}
              disabled={!canProceed()}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all ${
                canProceed() ? 'gradient-bg text-white shadow-lg shadow-primary/20 hover:opacity-90' : 'bg-border/50 text-muted cursor-not-allowed'
              }`}>
              下一步：上傳作品
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* ─── STEP 2: Upload ─── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold mb-2">上傳<span className="gradient-text">作品</span></h1>
                <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-muted">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${mode === 'coloring' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                    {mode === 'coloring' ? '🎨 填色' : '✏️ 設計'}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scoringEngine === 'gpt4o' ? 'bg-info/10 text-info' : scoringMode === 'custom' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                    {scoringMode === 'custom' ? '⚙️ 自定義評分' : scoringEngine === 'gpt4o' ? '🤖 GPT-4o Vision' : '📐 本地客觀分析'}
                  </span>
                  {mode === 'design' && theme && (
                    <span className="px-2.5 py-1 rounded-full bg-navy-light text-xs font-medium">主題：{theme}</span>
                  )}
                </div>
                <p className="text-xs text-muted mt-2">最多 {MAX_FILES} 個檔案 · 單檔上限 25 MB · 支援批量拖放</p>
              </div>

              <button onClick={() => setStep('setup')} className="flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4" /> 返回設定
              </button>

              <div
                {...getRootProps()}
                className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragActive ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40'
                }`}
              >
                <input {...getInputProps()} />
                <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }} className="w-14 h-14 rounded-2xl gradient-bg mx-auto flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
                  <Images className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold mb-1">{isDragActive ? '放開以上傳' : '拖放檔案至此處'}</h3>
                <p className="text-muted text-sm">支援一次選取多個檔案</p>
              </div>

              {uploadNotice && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/8 p-3 text-sm" role="status">
                  <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
                  <span className="text-warning">{uploadNotice}</span>
                  <button type="button" aria-label="關閉提示" onClick={() => setUploadNotice(null)} className="ml-auto px-1 text-warning hover:text-foreground">×</button>
                </div>
              )}

              {totalFiles >= MAX_FILES && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-warning/20 bg-warning/8 p-3 text-sm">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                  <span className="text-warning font-medium">已達上限 {MAX_FILES} 個檔案</span>
                </div>
              )}

              <AnimatePresence>
                {totalFiles > 0 && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">已選擇 {totalFiles} 個檔案</span>
                      <button
                        type="button"
                        onClick={() => {
                          previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
                          previewUrlsRef.current.clear();
                          setFilesWithPreview([]);
                        }}
                        className="text-xs text-danger hover:underline"
                      >清除全部</button>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
                      {filesWithPreview.map((fp, i) => (
                        <motion.div key={fp.file.name + i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-card rounded-lg border border-border overflow-hidden group">
                          <div className="aspect-square bg-navy/40 flex items-center justify-center overflow-hidden">
                            {fp.preview ? (
                              <img src={fp.preview} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="w-6 h-6 text-muted" />
                            )}
                          </div>
                          <button
                            type="button"
                            aria-label={`移除 ${fp.file.name}`}
                            onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                            className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-100 transition-opacity sm:h-5 sm:w-5 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={startBatchScoring}
                disabled={totalFiles === 0}
                className={`w-full mt-6 py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2 transition-all ${
                  totalFiles > 0 ? 'gradient-bg text-white shadow-xl shadow-primary/25 hover:opacity-90' : 'bg-navy-light text-muted/60 cursor-not-allowed'
                }`}
                whileHover={totalFiles > 0 ? { scale: 1.01 } : {}}
                whileTap={totalFiles > 0 ? { scale: 0.99 } : {}}
              >
                <Sparkles className="w-5 h-5" />
                {totalFiles > 1 ? `批量評分 ${totalFiles} 個作品` : totalFiles === 1 ? '開始評分' : '請先上傳作品'}
              </motion.button>
            </motion.div>
          )}

          {/* ─── STEP 3: Scoring ─── */}
          {step === 'scoring' && (
            <motion.div key="scoring" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card rounded-2xl border border-border p-6">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full gradient-bg mx-auto flex items-center justify-center mb-4 animate-pulse-glow">
                  {completedCount < scoringFiles.length ? <Loader2 className="h-7 w-7 animate-spin text-white" /> : scoringError ? <AlertCircle className="h-7 w-7 text-white" /> : <CheckCircle2 className="h-7 w-7 text-white" />}
                </div>
                <h3 className="mb-1 text-lg font-bold">
                  {completedCount < scoringFiles.length ? `正在評分... (${completedCount}/${scoringFiles.length})` : scoringError ? '評分完成，但有檔案失敗' : '全部評分完成！'}
                </h3>
                <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-muted">
                  <span>{mode === 'design' && theme ? `設計比賽 · ${theme}` : '填色比賽'}</span>
                  <span>·</span>
                  <span>{scoringMode === 'custom' ? '自定義評分' : scoringEngine === 'gpt4o' ? 'GPT-4o Vision' : '本地客觀分析'}</span>
                  <span>·</span>
                  <span>{criteria.filter((c) => c.name.trim()).length} 個維度</span>
                </div>
                <div className="max-w-sm mx-auto mt-4">
                  <div className="h-2 bg-navy-light rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-accent" animate={{ width: `${scoringFiles.length > 0 ? (completedCount / scoringFiles.length) * 100 : 0}%` }} transition={{ duration: 0.3 }} />
                  </div>
                </div>
              </div>

              {scoringError && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-danger/20 bg-danger/5 p-4" role="alert">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-danger">評分未能全部完成</p>
                    <p className="mt-1 text-xs leading-5 text-muted">{scoringError}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => { setScoringError(null); setStep('upload'); }} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold transition-colors hover:bg-card">返回檔案重試</button>
                      <Link to="/history" className="text-xs font-semibold text-primary hover:underline">查看已保存結果</Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-1.5 overflow-y-auto max-h-[400px] sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
                {scoringFiles.map((sf, i) => (
                  <div key={i} title={sf.error} className={`relative rounded-lg border overflow-hidden transition-all ${
                    sf.status === 'done' ? 'border-success/40' : sf.status === 'error' ? 'border-danger/50' : sf.status === 'analyzing' ? 'border-primary/40' : 'border-border opacity-40'
                  }`}>
                    <div className="aspect-square bg-navy/40 flex items-center justify-center overflow-hidden relative">
                      {sf.preview ? (
                        <img src={sf.preview} alt="" className={`w-full h-full object-cover ${sf.status === 'waiting' ? 'grayscale opacity-40' : ''}`} />
                      ) : <FileText className="w-5 h-5 text-muted" />}
                      {sf.status === 'analyzing' && (
                        <div className="absolute inset-0 bg-primary/15 flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-primary animate-spin" />
                        </div>
                      )}
                      {sf.status === 'done' && sf.score !== undefined && (
                        <div className="absolute right-0.5 top-0.5">
                          <div className={`flex h-6 w-6 items-center justify-center rounded text-[9px] font-bold text-white ${
                            sf.score >= 75 ? 'bg-success' : sf.score >= 55 ? 'bg-primary' : sf.score >= 40 ? 'bg-warning' : 'bg-danger'
                          }`}>{sf.score}</div>
                        </div>
                      )}
                      {sf.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-danger/15">
                          <AlertCircle className="h-5 w-5 text-danger" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
