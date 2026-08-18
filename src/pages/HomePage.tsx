import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileImage,
  History,
  Sparkles,
  Upload,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: FileImage,
    title: '像素級分析',
    description: '從亮度、對比度、色彩到細節密度，將作品轉成可理解的數據。',
    color: 'text-primary bg-primary/10',
  },
  {
    icon: Zap,
    title: '本地快速評分',
    description: '不必等待上傳伺服器，支援離線完成基礎分析，作品留在你的裝置上。',
    color: 'text-accent bg-accent/10',
  },
  {
    icon: BarChart3,
    title: '批量對比',
    description: '一次處理最多 100 件作品，用排名、雷達圖與表格快速找出亮點。',
    color: 'text-success bg-success/10',
  },
  {
    icon: History,
    title: '成長追蹤',
    description: '保存歷史評分、查看趨勢，讓每次修改都有明確的改善方向。',
    color: 'text-warning bg-warning/10',
  },
];

const steps = [
  ['01', '設定評分方式', '選擇填色或設計比賽，還可以自訂評分項目與權重。'],
  ['02', '上傳作品', '拖放一件或多件作品，手機也能直接從相簿選取。'],
  ['03', '取得評分報告', '查看總分、分項分析、優勢與下一步建議。'],
];

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <section className="relative flex min-h-[min(720px,calc(100dvh-4rem))] items-center justify-center px-4 pb-16 pt-28 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[min(800px,100vw)] -translate-x-1/2 rounded-full bg-gradient-to-br from-primary/10 via-accent/5 to-transparent blur-3xl" />
        <div className="relative mx-auto w-full max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-6 inline-flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>ScoreAI 智慧評分工具</span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              用數據 <span className="gradient-text">解讀作品</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
              將創意轉化為清晰的評分報告。支援手機、批量上傳與自訂權重，從第一眼檢視到長期成長，一個工具就能完成。
            </p>

            <div className="mx-auto mt-8 flex w-full max-w-xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link to="/upload" className="gradient-bg inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-primary/20 transition-all hover:opacity-90 sm:px-9">
                <Upload className="h-5 w-5" />
                立即上傳作品
              </Link>
              <Link to="/dashboard" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card px-7 py-3.5 text-base font-bold text-foreground transition-all hover:border-primary/30 sm:px-9">
                <BarChart3 className="h-5 w-5" />
                查看儀表板
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted sm:text-sm">
              {['本地優先', '支援批量評分', '無需註冊'].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-y border-border bg-navy/40 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">為創作者而生</p>
            <h2 className="text-2xl font-bold sm:text-3xl">從上傳到洞察，流程更簡單</h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">不只給你一個分數，也告訴你分數從何而來，以及下一步可以怎麼做。</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.article key={feature.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ delay: index * 0.06 }} className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${feature.color}`}>
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{feature.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary">三步開始</p>
              <h2 className="text-2xl font-bold sm:text-3xl">把作品變成下一個突破</h2>
            </div>
            <Link to="/upload" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              開始評分 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map(([number, title, description]) => (
              <div key={number} className="relative rounded-2xl border border-border bg-card p-5 sm:p-6">
                <span className="gradient-text text-3xl font-bold">{number}</span>
                <h3 className="mt-4 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
