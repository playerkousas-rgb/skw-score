import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Share2, Sparkles, Lightbulb, ThumbsUp,
  Tag, TrendingUp, FileText, Info, ZoomIn, X,
} from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';
import ScoreRing from '../components/ScoreRing';
import ProgressBar from '../components/ProgressBar';
import { useAppStore } from '../store/appStore';

export default function ResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { submissions, currentSubmission, setCurrentSubmission } = useAppStore();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const submission = currentSubmission?.id === id
    ? currentSubmission
    : submissions.find((s) => s.id === id);

  useEffect(() => {
    if (submission && submission.id !== currentSubmission?.id) {
      setCurrentSubmission(submission);
    }
  }, [submission]);

  if (!submission || !submission.score) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">找不到評分結果</h2>
          <Link to="/upload" className="text-primary font-semibold hover:underline">前往上傳作品</Link>
        </div>
      </div>
    );
  }

  const { score, fileName, fileType, thumbnail, fullImage, contestConfig } = submission;
  const isImage = fileType?.startsWith('image/');
  const displayImage = fullImage || thumbnail;

  // Compute weight percentages
  const totalWeight = score.categories.reduce((s, c) => s + (c.weight || 0), 0);

  const radarData = score.categories.map((c) => ({
    subject: c.name.length > 4 ? c.name.slice(0, 4) : c.name,
    value: c.score,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-border/50 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">AI 評分報告</h1>
              <div className="flex items-center gap-2 text-sm text-muted mt-0.5">
                <FileText className="w-3.5 h-3.5" />
                {fileName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-xl border border-border hover:bg-card transition-colors"><Share2 className="w-4 h-4" /></button>
            <button className="p-2.5 rounded-xl border border-border hover:bg-card transition-colors"><Download className="w-4 h-4" /></button>
            <Link to="/upload" className="gradient-bg text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">再次上傳</Link>
          </div>
        </motion.div>

        {/* Contest context */}
        {contestConfig && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-card border border-border flex flex-wrap items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${contestConfig.mode === 'coloring' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
              {contestConfig.mode === 'coloring' ? '🎨 填色比賽' : '✏️ 設計比賽'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${contestConfig.scoringMode === 'ai' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'}`}>
              {contestConfig.scoringMode === 'ai' ? '🤖 AI 評分' : '⚙️ 自定義'}
            </span>
            {contestConfig.theme && <span className="text-sm font-semibold">主題：{contestConfig.theme}</span>}
            <span className="text-xs text-muted">{contestConfig.criteria.length} 個維度（加權 100%）</span>
          </motion.div>
        )}

        {/* Non-image notice */}
        {!isImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-warning/8 border border-warning/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-warning">非圖片格式 — 有限分析</div>
              <div className="text-xs text-muted mt-1">建議上傳 PNG、JPG、WebP 等圖片格式以獲得完整的像素級視覺分析。</div>
            </div>
          </motion.div>
        )}

        {/* Full-size Image for review */}
        {displayImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
              <img
                src={displayImage}
                alt={fileName}
                className="w-full max-h-[500px] object-contain bg-navy/40"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">點擊放大查看</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">{fileName}</span>
              <span className="text-[10px] text-muted">評審核實用大圖</span>
            </div>
          </motion.div>
        )}

        {/* Lightbox */}
        <AnimatePresence>
          {lightboxOpen && displayImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setLightboxOpen(false)}
            >
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                src={displayImage}
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl">
                <span className="text-white text-sm font-medium">{fileName}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Score Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
            {/* Total Score */}
            <div className="bg-card rounded-2xl border border-border p-8 text-center">
              <ScoreRing score={score.totalScore} size={180} strokeWidth={10} />
              <div className="mt-4">
                <div className="text-lg font-bold">總分</div>
                <div className="text-sm text-muted mt-1">{isImage ? '基於像素分析的綜合評分' : '基於元數據的估算評分'}</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-5">
                {score.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium">
                    <Tag className="w-3 h-3" />{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />能力雷達圖
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#152244" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                  <Radar name="Score" dataKey="value" stroke="#38BDF8" fill="#38BDF8" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right: Details */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-6">
            {/* Category Scores with percentage weights */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                分項評分
              </h3>
              <div className="space-y-5">
                {score.categories.map((cat, i) => {
                  const pct = totalWeight > 0 ? Math.round((cat.weight || 0) / totalWeight * 100) : 0;
                  return (
                    <div key={cat.name}>
                      <ProgressBar
                        label={`${cat.name}`}
                        value={cat.score}
                        max={cat.maxScore}
                        feedback={cat.feedback}
                        delay={i * 0.1}
                        suffix={`佔 ${pct}%`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AI Comment */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />AI 分析摘要</h3>
              <div className="p-5 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
                <p className="text-sm leading-relaxed text-foreground/80">{score.aiComment}</p>
              </div>
            </div>

            {/* Strengths & Suggestions */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><ThumbsUp className="w-4 h-4 text-success" />檢測到的優勢</h3>
                <div className="space-y-3">
                  {score.strengths.map((s, i) => (
                    <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-success" /></div>
                      <span className="text-sm">{s}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-2xl border border-border p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-warning" />改進建議</h3>
                <div className="space-y-3">
                  {score.suggestions.map((s, i) => (
                    <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-xs font-bold text-warning">{i + 1}</span></div>
                      <span className="text-sm">{s}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Methodology */}
            <div className="p-4 rounded-xl bg-navy/50 border border-border">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted leading-relaxed">
                  <strong>評分方法：</strong>
                  {isImage
                    ? '基於客戶端像素級分析（亮度、對比度、色彩、邊緣密度、解析度等），各維度按百分比權重加權計算總分。所有分析在瀏覽器本地完成。'
                    : '非圖片格式，僅基於檔案元數據估算。建議上傳圖片以獲得完整分析。'}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
