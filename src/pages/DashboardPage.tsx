import { motion } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  Award,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Upload,
  Minus,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useAppStore } from '../store/appStore';
import ScoreRing from '../components/ScoreRing';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { submissions } = useAppStore();
  const completed = submissions.filter((s) => s.status === 'completed' && s.score);

  const hasData = completed.length > 0;

  const avgScore = hasData
    ? Math.round(completed.reduce((sum, s) => sum + (s.score?.totalScore || 0), 0) / completed.length)
    : 0;
  const highestScore = hasData
    ? Math.max(...completed.map((s) => s.score?.totalScore || 0))
    : 0;
  const latestScore = hasData ? completed[0].score?.totalScore || 0 : 0;

  // Compute real trend data from submissions (sorted by date)
  const trendData = [...completed]
    .sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime())
    .map((s, i) => ({
      date: new Date(s.uploadedAt).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      score: s.score?.totalScore || 0,
      name: s.fileName,
    }));

  // Compute real category averages from submissions
  const categoryNames = ['創意與原創性', '技術執行力', '視覺呈現', '內容深度', '整體完整性'];
  const categoryAvg = categoryNames.map((name) => {
    const scores = completed
      .map((s) => s.score?.categories.find((c) => c.name === name)?.score)
      .filter((s): s is number => s !== undefined);
    return {
      name: name.replace('與原創性', '').replace('執行力', '').replace('呈現', '').replace('深度', '').replace('完整性', ''),
      avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    };
  });

  // Compute real trend direction
  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  let trendDiff = 0;
  if (completed.length >= 2) {
    const latest = completed[0].score?.totalScore || 0;
    const previous = completed[1].score?.totalScore || 0;
    trendDiff = latest - previous;
    trendDirection = trendDiff > 0 ? 'up' : trendDiff < 0 ? 'down' : 'flat';
  }

  const statCards = [
    { icon: FileText, label: '已評分作品', value: completed.length.toString(), color: 'bg-primary/10 text-primary' },
    { icon: Target, label: '平均分數', value: hasData ? avgScore.toString() : '-', color: 'bg-accent/10 text-accent' },
    { icon: Award, label: '最高分數', value: hasData ? highestScore.toString() : '-', color: 'bg-success/10 text-success' },
    { icon: TrendingUp, label: '最新分數', value: hasData ? latestScore.toString() : '-', color: 'bg-info/10 text-info' },
  ];

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold">
              個人<span className="gradient-text">儀表板</span>
            </h1>
            <p className="text-muted mt-1">追蹤您的創作成長軌跡</p>
          </div>
          <Link
            to="/upload"
            className="gradient-bg text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            上傳新作品
          </Link>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-card rounded-2xl border border-border p-5 hover:shadow-lg hover:shadow-primary/5 transition-shadow"
            >
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {!hasData ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl border border-border p-16 text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-navy-light mx-auto flex items-center justify-center mb-6">
              <Upload className="w-10 h-10 text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-3">尚無評分數據</h3>
            <p className="text-muted mb-6 max-w-md mx-auto">
              上傳您的第一份作品，AI 將進行真實的視覺分析並生成評分報告。所有圖表和統計數據均基於您的實際提交結果。
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 gradient-bg text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Upload className="w-4 h-4" />
              上傳第一份作品
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Score Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2 bg-card rounded-2xl border border-border p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    分數趨勢
                  </h3>
                  <span className="text-xs text-muted">
                    基於 {completed.length} 次提交
                  </span>
                </div>
                {trendData.length >= 2 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#152244" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#7B8BA5' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7B8BA5' }} />
                      <Tooltip
                        contentStyle={{
                          background: '#081630',
                          border: '1px solid #152244',
                          borderRadius: '12px',
                          fontSize: '13px',
                        }}
                        formatter={(value: any, _name: any, props: any) => [
                          `${value} 分`,
                          props?.payload?.name ?? '',
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#38BDF8"
                        fill="url(#scoreGrad)"
                        strokeWidth={2.5}
                        dot={{ fill: '#38BDF8', strokeWidth: 2, r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted text-sm">
                    需要至少 2 次提交才能顯示趨勢圖表
                  </div>
                )}
              </motion.div>

              {/* Average Score Ring */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center"
              >
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  綜合評分
                </h3>
                <ScoreRing score={avgScore} size={160} strokeWidth={10} />
                <div className="mt-4 text-center">
                  <div className="text-sm font-semibold">平均分數</div>
                  <div className="text-xs text-muted mt-1">基於 {completed.length} 份作品</div>
                </div>
                {completed.length >= 2 && (
                  <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${
                    trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-danger' : 'text-muted'
                  }`}>
                    {trendDirection === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : trendDirection === 'down' ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <Minus className="w-4 h-4" />
                    )}
                    較上次{trendDirection === 'up' ? '提升' : trendDirection === 'down' ? '下降' : '持平'} {Math.abs(trendDiff)} 分
                  </div>
                )}
              </motion.div>
            </div>

            {/* Category Averages */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6 bg-card rounded-2xl border border-border p-6"
            >
              <h3 className="font-bold mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                各維度平均表現
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryAvg} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#152244" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#7B8BA5' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#7B8BA5' }} />
                  <Tooltip
                    contentStyle={{
                      background: '#081630',
                      border: '1px solid #152244',
                      borderRadius: '12px',
                      fontSize: '13px',
                    }}
                    formatter={(value: any) => [`${value} 分`, '平均分數']}
                  />
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#818CF8" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="avg" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Recent Submissions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 bg-card rounded-2xl border border-border p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  最近提交
                </h3>
                <Link to="/history" className="text-sm text-primary font-medium hover:underline">
                  查看全部
                </Link>
              </div>
              <div className="space-y-3">
                {completed.slice(0, 5).map((sub) => (
                  <Link
                    key={sub.id}
                    to={`/result/${sub.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl hover:bg-background transition-colors group"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        (sub.score?.totalScore || 0) >= 65 ? 'bg-primary/10' : 'bg-warning/10'
                      }`}
                    >
                      <span
                        className={`text-sm font-bold ${
                          (sub.score?.totalScore || 0) >= 65 ? 'text-primary' : 'text-warning'
                        }`}
                      >
                        {sub.score?.totalScore}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {sub.fileName}
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {new Date(sub.uploadedAt).toLocaleDateString('zh-TW')}
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
