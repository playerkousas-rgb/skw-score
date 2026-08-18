import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, ArrowRight, Search, Images, Eye, Trash2, AlertTriangle, HardDrive, LayoutGrid, List } from 'lucide-react';
import { useAppStore, type Submission } from '../store/appStore';
import { useState, useMemo } from 'react';

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

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

interface BatchGroup {
  batchId: string | undefined;
  items: Submission[];
  date: string;
  avgScore: number;
}

function SubmissionCard({ sub }: { sub: Submission }) {
  return (
    <Link
      to={`/result/${sub.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative aspect-square overflow-hidden bg-navy/40">
        {sub.thumbnail ? (
          <img src={sub.thumbnail} alt={sub.fileName} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><FileText className="h-8 w-8 text-muted" /></div>
        )}
        <div className="absolute right-1.5 top-1.5">
          <div className={`rounded-md px-2 py-1 text-xs font-bold text-white shadow ${getScoreBg(sub.score?.totalScore ?? 0)}`}>
            {sub.score?.totalScore ?? '-'}
          </div>
        </div>
      </div>
      <div className="p-2.5">
        <div className="truncate text-xs font-semibold transition-colors group-hover:text-primary">{sub.fileName}</div>
        <div className="mt-0.5 text-[10px] text-muted">{formatSize(sub.fileSize)}</div>
      </div>
    </Link>
  );
}

export default function HistoryPage() {
  const { submissions, clearAllSubmissions, clearSubmission, clearBatch } = useAppStore();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'batch' | 'flat'>('batch');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [deletingBatchId, setDeletingBatchId] = useState<string | null>(null);

  const completed = submissions.filter(
    (s) =>
      s.status === 'completed' &&
      s.fileName.toLowerCase().includes(search.toLowerCase())
  );

  // Group by batch
  const batches = useMemo(() => {
    const map = new Map<string, typeof completed>();
    completed.forEach((sub) => {
      const key = sub.batchId || sub.id; // single items use their own id
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sub);
    });

    const groups: BatchGroup[] = [];
    map.forEach((items) => {
      const avgScore = Math.round(
        items.reduce((s, i) => s + (i.score?.totalScore || 0), 0) / items.length
      );
      groups.push({
        batchId: items[0].batchId,
        items,
        date: items[0].uploadedAt,
        avgScore,
      });
    });

    groups.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return groups;
  }, [completed]);

  const flatItems = useMemo(
    () => [...completed].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    [completed]
  );

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            歷史<span className="gradient-text">紀錄</span>
          </h1>
          <p className="text-muted">查看所有已評分的作品與批次結果</p>
        </motion.div>

        {/* Search & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-3 mb-4"
        >
          <div className="relative min-w-[min(100%,16rem)] flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="搜尋作品名稱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
          </div>
          {completed.length > 0 && (
            <>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1" aria-label="檢視模式">
                <button type="button" onClick={() => setViewMode('batch')} aria-label="批次檢視" aria-pressed={viewMode === 'batch'} className={`min-h-10 rounded-lg p-2 transition-colors ${viewMode === 'batch' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}>
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setViewMode('flat')} aria-label="全部作品檢視" aria-pressed={viewMode === 'flat'} className={`min-h-10 rounded-lg p-2 transition-colors ${viewMode === 'flat' ? 'bg-primary/10 text-primary' : 'text-muted hover:text-foreground'}`}>
                  <List className="h-4 w-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex min-h-11 items-center gap-1.5 rounded-xl border border-danger/20 px-4 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/5"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">清除全部</span>
              </button>
            </>
          )}
        </motion.div>

        {/* Storage notice */}
        <div className="flex items-center gap-2 mb-6 text-[11px] text-muted">
          <HardDrive className="w-3 h-3" />
          <span>所有紀錄儲存於本機瀏覽器（localStorage），清除瀏覽器數據將會遺失。</span>
        </div>

        {/* Clear all confirm dialog */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-2xl bg-danger/5 border border-danger/20"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-danger">確定要清除所有歷史紀錄？</div>
                  <div className="text-xs text-muted mt-1">此操作無法復原，所有評分結果和圖片將永久刪除。</div>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => { clearAllSubmissions(); setShowClearConfirm(false); }}
                      className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-bold hover:bg-danger/90 transition-colors"
                    >
                      確認清除全部
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-card transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        {completed.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-2xl bg-navy-light mx-auto flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-muted" />
            </div>
            <h3 className="font-bold text-lg mb-2">{search ? '找不到符合的作品' : '尚無紀錄'}</h3>
            <p className="text-muted text-sm mb-6">{search ? '試試其他檔案名稱或清除搜尋條件。' : '上傳您的第一份作品開始評分'}</p>
            {search ? (
              <button type="button" onClick={() => setSearch('')} className="rounded-xl border border-border px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-card">清除搜尋</button>
            ) : (
              <Link to="/upload" className="gradient-bg rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">前往上傳</Link>
            )}
          </motion.div>
        ) : viewMode === 'flat' ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {flatItems.map((sub) => <SubmissionCard key={sub.id} sub={sub} />)}
          </div>
        ) : (
          <div className="space-y-6">
            {batches.map((batch, bi) => (
              <motion.div
                key={batch.batchId || batch.items[0].id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: bi * 0.05 }}
              >
                {/* Batch header */}
                {batch.items.length > 1 && (
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Images className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">
                        批次上傳 · {batch.items.length} 件作品
                      </span>
                      <span className="text-xs text-muted">
                        平均 {batch.avgScore} 分
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(batch.date)}
                      </span>
                      {batch.batchId && (
                        <Link
                          to={`/compare/${batch.batchId}`}
                          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          對比檢視
                        </Link>
                      )}
                      {batch.batchId && (
                        deletingBatchId === batch.batchId ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { clearBatch(batch.batchId!); setDeletingBatchId(null); }}
                              className="text-[11px] font-bold text-danger hover:underline"
                            >確認刪除</button>
                            <button
                              onClick={() => setDeletingBatchId(null)}
                              className="text-[11px] text-muted hover:underline"
                            >取消</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingBatchId(batch.batchId!)}
                            className="text-xs text-muted hover:text-danger transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Items grid */}
                {batch.items.length > 1 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[...batch.items]
                      .sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0))
                      .map((sub) => <SubmissionCard key={sub.id} sub={sub} />)}
                  </div>
                ) : (
                  /* Single item row */
                  <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 sm:gap-4 sm:p-4">
                    <Link to={`/result/${batch.items[0].id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                      {batch.items[0].thumbnail ? (
                        <img src={batch.items[0].thumbnail} alt={batch.items[0].fileName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-navy-light"><FileText className="h-6 w-6 text-muted" /></div>
                      )}

                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        (batch.items[0].score?.totalScore || 0) >= 65 ? 'bg-primary/10' : 'bg-warning/10'
                      }`}>
                        <span className={`text-lg font-bold ${getScoreColor(batch.items[0].score!.totalScore)}`}>
                          {batch.items[0].score!.totalScore}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold transition-colors group-hover:text-primary">{batch.items[0].fileName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="flex items-center gap-1 text-xs text-muted"><Clock className="h-3 w-3" />{formatDate(batch.items[0].uploadedAt)}</span>
                          <span className="text-xs text-muted">{formatSize(batch.items[0].fileSize)}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {batch.items[0].score!.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="rounded-md bg-primary/6 px-2 py-0.5 text-[11px] font-medium text-primary">{tag}</span>
                          ))}
                        </div>
                      </div>

                      <ArrowRight className="h-5 w-5 shrink-0 text-muted transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`刪除 ${batch.items[0].fileName}`}
                      title="刪除此紀錄"
                      onClick={() => {
                        if (window.confirm(`確定要刪除「${batch.items[0].fileName}」嗎？`)) clearSubmission(batch.items[0].id);
                      }}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
