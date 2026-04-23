import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Upload, Zap, BarChart3, Shield, ArrowRight, Sparkles, FileText,
  TrendingUp, CheckCircle2, Eye, Palette, Ruler,
} from 'lucide-react';

const features = [
  { icon: Eye, title: '真實像素分析', desc: 'AI 逐像素解析您的圖片，分析亮度、對比度、色彩分佈與邊緣密度等真實數據。' },
  { icon: BarChart3, title: '多維度評分', desc: '每個維度的分數都基於可量化的圖像指標，權重以百分比呈現，總計 100%。' },
  { icon: Shield, title: '透明可驗證', desc: '所有評分依據均在報告中明確說明，包含具體數值（解析度、對比度標準差等）。' },
  { icon: TrendingUp, title: '真實成長追蹤', desc: '儀表板數據完全基於您的實際提交記錄，沒有虛構的統計或排名。' },
];

const analysisItems = [
  { icon: Palette, label: '色彩豐富度', desc: '飽和度、色相分佈、獨特色彩比例' },
  { icon: Ruler, label: '技術品質', desc: '解析度、長寬比、對比度標準差' },
  { icon: Eye, label: '視覺平衡', desc: '亮度分佈、曝光評估、明暗層次' },
  { icon: Zap, label: '細節密度', desc: '邊緣檢測、紋理複雜度、資訊量' },
];

const steps = [
  { num: '01', icon: Upload, title: '上傳圖片', desc: '拖放 PNG、JPG、WebP 等圖片格式' },
  { num: '02', icon: Sparkles, title: '像素級分析', desc: 'AI 解析色彩、對比、細節等真實數據' },
  { num: '03', icon: FileText, title: '數據化報告', desc: '每項評分附帶具體數值與改進建議' },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/8 via-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-96 h-96 bg-accent/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              基於真實像素分析的 AI 評分
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
              用數據
              <br />
              <span className="gradient-text">解讀您的作品</span>
            </h1>
            <p className="text-lg text-muted leading-relaxed mb-10 max-w-2xl mx-auto">
              上傳圖片，AI 將逐像素分析色彩、對比度、細節密度等真實指標，生成透明、可驗證的多維度評分報告。每項分數都有明確的數據依據。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/upload" className="gradient-bg text-white px-8 py-3.5 rounded-2xl text-base font-semibold hover:opacity-90 transition-opacity shadow-xl shadow-primary/20 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                立即上傳作品
              </Link>
              <Link to="/dashboard" className="px-8 py-3.5 rounded-2xl text-base font-semibold border border-border hover:bg-card hover:border-primary/30 transition-colors flex items-center gap-2 text-foreground">
                查看儀表板
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }} className="mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border">
              <img src="/images/ai-hero.png" alt="AI Scoring" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex flex-wrap gap-3">
                  {['像素分析', '色彩評估', '對比度檢測', '細節密度'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-sm font-medium border border-white/10">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Analysis Items */}
      <section className="py-16 border-y border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">分析維度</span>
            <h2 className="text-2xl sm:text-3xl font-bold mt-2">AI 實際分析的指標</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {analysisItems.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <a.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="font-bold mb-1">{a.label}</div>
                <div className="text-sm text-muted">{a.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">流程</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">三步驟完成評分</h2>
            <p className="text-muted mt-4 max-w-xl mx-auto">簡單直覺的操作流程，讓您專注於創作本身</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group">
                <div className="text-5xl font-black text-primary/8 absolute top-4 right-6">{step.num}</div>
                <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-5 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">特色</span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">為什麼選擇 ScoreAI</h2>
          </motion.div>
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <motion.div key={f.title} variants={item} className="bg-background rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Report Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">報告範例</span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">數據驅動的評分報告</h2>
              <p className="text-muted leading-relaxed mb-8">每份報告都包含具體的數據指標，讓您清楚了解每項分數的來源。沒有模糊的描述，只有可驗證的分析結果。</p>
              <div className="space-y-4">
                {['總分基於各維度加權百分比計算', '每項回饋附帶具體數值（如亮度 142/255）', '改進建議針對實際檢測到的弱項', '所有指標可通過重新上傳驗證一致性'].map((t) => (
                  <div key={t} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-sm font-medium">{t}</span>
                  </div>
                ))}
              </div>
              <Link to="/upload" className="inline-flex items-center gap-2 mt-8 gradient-bg text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
                上傳試試 <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card rounded-2xl border border-border p-6 shadow-xl shadow-primary/5">
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="font-bold">評分報告範例</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium ml-auto border border-primary/20">示範</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '創意與原創性', pct: '25%', desc: '色彩豐富度、獨特色彩比例' },
                  { label: '技術執行力', pct: '20%', desc: '解析度、對比度標準差' },
                  { label: '視覺呈現', pct: '25%', desc: '亮度平衡、飽和度' },
                  { label: '內容深度', pct: '15%', desc: '邊緣密度、色域覆蓋率' },
                  { label: '整體完整性', pct: '15%', desc: '各維度均衡度' },
                ].map((bar) => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{bar.label}</span>
                      <span className="text-primary text-xs font-semibold">{bar.pct}</span>
                    </div>
                    <div className="h-2 bg-navy-light/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-border w-0" />
                    </div>
                    <div className="text-[11px] text-muted mt-1">{bar.desc}</div>
                  </div>
                ))}
              </div>
              <div className="mt-5 p-4 rounded-xl bg-primary/5 border border-primary/15">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted leading-relaxed">上傳您的圖片後，此處將顯示基於真實像素分析的具體評分與回饋。</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="gradient-bg rounded-3xl p-10 sm:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">準備好了嗎？</h2>
              <p className="text-white/80 mb-8 max-w-lg mx-auto">上傳一張圖片，親自驗證 AI 的分析能力。所有評分數據公開透明。</p>
              <Link to="/upload" className="inline-flex items-center gap-2 bg-white text-navy px-8 py-3.5 rounded-2xl text-base font-bold hover:bg-white/90 transition-colors shadow-xl">
                <Upload className="w-5 h-5" /> 開始使用
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold">
                Score<span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="text-xs text-muted">© 2026 SKWSCOUT. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
