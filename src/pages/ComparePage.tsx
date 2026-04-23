import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowUpDown,
  Upload,
  FileText,
  Image,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  LayoutGrid,
  List,
  Trophy,
  Medal,
  Award,
  Tag,
  Info,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import ScoreRing from '../components/ScoreRing';
import { useAppStore, type Submission } from '../store/appStore';

type SortKey = string;
type ViewMode = 'grid' | 'table';

const RADAR_COLORS = [
  '#38BDF8', '#FBBF24', '#34D399', '#F87171', '#818CF8',
  '#60A5FA', '#F472B6', '#2DD4BF', '#FB923C', '#A78BFA',
];

function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 65) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-danger';
}

function getScoreBg(score: number) {
  if (score >= 80) return 'bg-success';
  if (score >= 65) return 'bg-primary';
  if (score >= 50) return 'bg-warning';
  return 'bg-danger';
}

function getRankIcon(rank: number) {
  if (rank === 0) return <Trophy className="w-5 h-5 text-amber-500" />;
  if (rank === 1) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 2) return <Award className="w-5 h-5 text-amber-700" />;
  return <span className="text-xs font-bold text-muted">#{rank + 1}</span>;
}

export default function ComparePage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { submissions, setCurrentSubmission } = useAppStore();

  const batchItems = useMemo(
    () => submissions.filter((s) => s.batchId === batchId && s.status === 'completed' && s.score),
    [submissions, batchId]
  );

  const [sortKey, setSortKey] = useState<SortKey>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  // Dynamic sort options from actual categories
  const SORT_OPTIONS = useMemo(() => {
    const opts: { key: string; label: string }[] = [
      { key: 'score', label: '總分' },
      { key: 'name', label: '檔案名稱' },
    ];
    if (batchItems[0]?.score?.categories) {
      batchItems[0].score.categories.forEach((cat, i) => {
        opts.push({ key: `cat-${i}`, label: cat.name });
      });
    }
    return opts;
  }, [batchItems]);

  const sorted = useMemo(() => {
    const arr = [...batchItems];
    arr.sort((a, b) => {
      let va: number | string = 0, vb: number | string = 0;
      if (sortKey === 'score') {
        va = a.score!.totalScore;
        vb = b.score!.totalScore;
      } else if (sortKey === 'name') {
        va = a.fileName.toLowerCase();
        vb = b.fileName.toLowerCase();
      } else if (sortKey.startsWith('cat-')) {
        const idx = parseInt(sortKey.replace('cat-', ''));
        va = a.score!.categories[idx]?.score ?? 0;
        vb = b.score!.categories[idx]?.score ?? 0;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sortAsc ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return arr;
  }, [batchItems, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setShowSortMenu(false);
  };

  // Radar overlay data (top 5 or all if <= 5)
  const radarItems = sorted.slice(0, Math.min(5, sorted.length));
  const categoryNames = (batchItems[0]?.score?.categories ?? []).map((c) => c.name.slice(0, 4));
  const radarData = categoryNames.map((name, i) => {
    const entry: Record<string, any> = { subject: name };
    radarItems.forEach((item, j) => {
      entry[item.id] = item.score!.categories[i]?.score ?? 0;
    });
    return entry;
  });

  // Stats
  const avgScore = batchItems.length > 0
    ? Math.round(batchItems.reduce((s, b) => s + (b.score?.totalScore || 0), 0) / batchItems.length)
    : 0;
  const maxScore = batchItems.length > 0
    ? Math.max(...batchItems.map((b) => b.score?.totalScore || 0))
    : 0;
  const minScore = batchItems.length > 0
    ? Math.min(...batchItems.map((b) => b.score?.totalScore || 0))
    : 0;

  if (batchItems.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">找不到批次結果</h2>
          <Link to="/upload" className="text-primary font-semibold hover:underline">
            前往上傳作品
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-border/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                批量評分<span className="gradient-text">對比</span>
              </h1>
              <p className="text-sm text-muted mt-0.5">
                共 {batchItems.length} 件作品 · 平均 {avgScore} 分
              </p>
            </div>
          </div>
          <Link
            to="/upload"
            className="gradient-bg text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            上傳更多
          </Link>
        </motion.div>

        {/* Contest Context Banner */}
        {batchItems[0]?.contestConfig && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 }}
            className="mb-6 p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center gap-3"
          >
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              batchItems[0].contestConfig.mode === 'coloring' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
            }`}>
              {batchItems[0].contestConfig.mode === 'coloring' ? '🎨 填色比賽' : '✏️ 設計比賽'}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              batchItems[0].contestConfig.scoringMode === 'ai' ? 'bg-info/10 text-info' : 'bg-warning/10 text-warning'
            }`}>
              {batchItems[0].contestConfig.scoringMode === 'ai' ? '🤖 AI 評分' : '⚙️ 自定義評分'}
            </span>
            {batchItems[0].contestConfig.theme && (
              <span className="text-sm font-semibold">主題：{batchItems[0].contestConfig.theme}</span>
            )}
            {batchItems[0].contestConfig.description && (
              <span className="text-xs text-muted">— {batchItems[0].contestConfig.description}</span>
            )}
            <span className="text-xs text-muted ml-auto">{batchItems[0].contestConfig.criteria.length} 個維度</span>
          </motion.div>
        )}

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          {[
            { label: '最高分', value: maxScore, color: 'text-success' },
            { label: '平均分', value: avgScore, color: 'text-primary' },
            { label: '最低分', value: minScore, color: 'text-warning' },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-2xl border border-border p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Radar Overlay (if multiple) */}
        {batchItems.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl border border-border p-6 mb-6"
          >
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              維度對比雷達圖
              {radarItems.length < batchItems.length && (
                <span className="text-xs text-muted font-normal">（顯示前 {radarItems.length} 名）</span>
              )}
            </h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#152244" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#7B8BA5' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#5A6B85' }} />
                {radarItems.map((item, i) => (
                  <Radar
                    key={item.id}
                    name={item.fileName.length > 15 ? item.fileName.slice(0, 15) + '…' : item.fileName}
                    dataKey={item.id}
                    stroke={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fill={RADAR_COLORS[i % RADAR_COLORS.length]}
                    fillOpacity={0.06}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string) => <span className="text-muted">{value}</span>}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-between mb-4"
        >
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-sm font-medium hover:border-primary/30 transition-colors"
            >
              <ArrowUpDown className="w-4 h-4 text-muted" />
              {SORT_OPTIONS.find((o) => o.key === sortKey)?.label}
              {sortAsc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showSortMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-1 left-0 bg-card rounded-xl border border-border shadow-xl z-20 py-1 min-w-[180px]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => toggleSort(opt.key)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors flex items-center justify-between ${
                      sortKey === opt.key ? 'text-primary font-semibold' : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                    {sortKey === opt.key && (
                      <span className="text-xs text-muted">{sortAsc ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Close sort menu on outside click */}
        {showSortMenu && (
          <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
        )}

        {/* Pagination info */}
        {sorted.length > PAGE_SIZE && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-muted">
              顯示 {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sorted.length)} / 共 {sorted.length} 件
            </span>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.ceil(sorted.length / PAGE_SIZE) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    page === i ? 'gradient-bg text-white' : 'bg-card border border-border text-muted hover:text-foreground'
                  }`}
                >{i + 1}</button>
              ))}
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((sub, idx) => {
              const i = page * PAGE_SIZE + idx;
              return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300 group"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-navy/40 overflow-hidden">
                  {sub.thumbnail ? (
                    <img
                      src={sub.thumbnail}
                      alt={sub.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-muted" />
                    </div>
                  )}

                  {/* Rank badge */}
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow">
                    {getRankIcon(i)}
                  </div>

                  {/* Score badge */}
                  <div className="absolute top-3 right-3">
                    <div className={`px-3 py-1.5 rounded-lg text-white text-sm font-bold shadow-lg ${getScoreBg(sub.score!.totalScore)}`}>
                      {sub.score!.totalScore}
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-sm font-semibold truncate mb-2">{sub.fileName}</div>

                  {/* Mini category bars */}
                  <div className="space-y-1.5 mb-3">
                    {sub.score!.categories.map((cat) => (
                      <div key={cat.name} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted w-10 truncate flex-shrink-0">
                          {cat.name.slice(0, 2)}
                        </span>
                        <div className="flex-1 h-1.5 bg-navy-light rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              cat.score >= 75
                                ? 'bg-gradient-to-r from-primary to-accent'
                                : cat.score >= 55
                                ? 'bg-warning'
                                : 'bg-danger'
                            }`}
                            style={{ width: `${cat.score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold w-6 text-right">{cat.score}</span>
                      </div>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {sub.score!.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-primary/6 text-primary font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Expand / View detail */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
                      className="flex-1 text-xs font-medium py-2 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-colors flex items-center justify-center gap-1"
                    >
                      {expandedId === sub.id ? (
                        <>收起 <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>展開詳情 <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                    <Link
                      to={`/result/${sub.id}`}
                      onClick={() => setCurrentSubmission(sub)}
                      className="px-3 py-2 rounded-lg bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      完整報告
                    </Link>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {expandedId === sub.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-border space-y-2">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                            <div className="flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-muted leading-relaxed line-clamp-4">
                                {sub.score!.aiComment}
                              </p>
                            </div>
                          </div>
                          {sub.score!.suggestions.slice(0, 2).map((s, j) => (
                            <div key={j} className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-warning mt-0.5">{j + 1}</span>
                              <span className="text-[11px] text-muted">{s}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
            })}
          </div>
        ) : (
          /* Table View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-navy/30">
                    <th className="text-left py-3 px-4 font-semibold text-muted text-xs">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted text-xs">作品</th>
                    <th
                      className="text-center py-3 px-3 font-semibold text-muted text-xs cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort('score')}
                    >
                      總分 {sortKey === 'score' && (sortAsc ? '↑' : '↓')}
                    </th>
                    {(batchItems[0]?.score?.categories ?? []).map((cat, idx) => (
                        <th
                          key={cat.name}
                          className="text-center py-3 px-2 font-semibold text-muted text-xs cursor-pointer hover:text-primary transition-colors hidden lg:table-cell"
                          onClick={() => toggleSort(`cat-${idx}`)}
                        >
                          {cat.name.slice(0, 4)} {sortKey === `cat-${idx}` && (sortAsc ? '↑' : '↓')}
                        </th>
                    ))}
                    <th className="text-center py-3 px-3 font-semibold text-muted text-xs">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map((sub, idx) => {
                    const i = page * PAGE_SIZE + idx;
                    return (
                    <tr
                      key={sub.id}
                      className="border-b border-border last:border-0 hover:bg-primary/3 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="w-6 h-6 flex items-center justify-center">
                          {getRankIcon(i)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {sub.thumbnail ? (
                            <img
                              src={sub.thumbnail}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-navy-light flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-muted" />
                            </div>
                          )}
                          <span className="font-medium truncate max-w-[180px]">{sub.fileName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold text-base ${getScoreColor(sub.score!.totalScore)}`}>
                          {sub.score!.totalScore}
                        </span>
                      </td>
                      {sub.score!.categories.map((cat) => (
                        <td key={cat.name} className="py-3 px-2 text-center hidden lg:table-cell">
                          <span className={`text-xs font-semibold ${getScoreColor(cat.score)}`}>
                            {cat.score}
                          </span>
                        </td>
                      ))}
                      <td className="py-3 px-3 text-center">
                        <Link
                          to={`/result/${sub.id}`}
                          onClick={() => setCurrentSubmission(sub)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/8 text-primary text-xs font-medium hover:bg-primary/15 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          詳情
                        </Link>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
