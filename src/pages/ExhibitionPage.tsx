import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Image as ImageIcon, Printer } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { Link, useLocation } from 'react-router-dom';

export default function ExhibitionPage() {
  const { submissions } = useAppStore();
  const location = useLocation();
  const isEmbed = location.search.includes('embed=true');
  const completed = submissions.filter((s) => s.status === 'completed' && s.score);

  // Sort by score descending
  const sorted = [...completed].sort((a, b) => (b.score?.totalScore || 0) - (a.score?.totalScore || 0));

  const top3 = sorted.slice(0, 3);
  const others = sorted.slice(3);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0: return { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-400/20', label: '冠軍' };
      case 1: return { icon: Award, color: 'text-gray-300', bg: 'bg-gray-300/20', label: '亞軍' };
      case 2: return { icon: Medal, color: 'text-amber-600', bg: 'bg-amber-600/20', label: '季軍' };
      default: return null;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen ${isEmbed ? "pt-8" : "pt-24"} pb-16 print:pt-4 print:pb-0`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 print:hidden"
        >
          <div>
            <h1 className="text-3xl font-bold">
              得獎及<span className="gradient-text">展覽館</span>
            </h1>
            <p className="text-muted mt-1">欣賞優秀的設計及填色作品</p>
          </div>
          <button style={{ display: isEmbed ? "none" : "flex" }}
            onClick={handlePrint}
            className="bg-card text-foreground border border-border px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-border/50 transition-colors shadow-lg flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            輸出為 PDF/列印
          </button>
        </motion.div>

        {/* Print Title (Visible only when printing) */}
        <div className="hidden print:block text-center mb-10">
          <h1 className="text-4xl font-bold text-black mb-2">比賽結果及展覽作品</h1>
          <p className="text-gray-600">評分結果</p>
        </div>

        {/* Top 3 Section */}
        {top3.length > 0 && (
          <div className="mb-16 page-break-after">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2 print:text-black">
              <Trophy className="w-6 h-6 text-yellow-400" />
              冠亞季軍大賞
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {top3.map((sub, idx) => {
                const rank = getRankBadge(idx);
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative bg-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all group print:border-gray-300 print:bg-white"
                  >
                    <div className="absolute top-4 left-4 z-10">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md font-bold text-sm shadow-lg ${rank?.bg} ${rank?.color}`}>
                        {rank && <rank.icon className="w-4 h-4" />}
                        {rank?.label}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 z-10">
                      <div className="bg-black/60 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-lg border border-white/10 shadow-lg print:bg-gray-200 print:text-black print:border-gray-400">
                        {sub.score?.totalScore} 分
                      </div>
                    </div>
                    <div className="aspect-[4/3] w-full bg-navy/40 overflow-hidden print:bg-gray-100">
                      {sub.fullImage || sub.thumbnail ? (
                        <img
                          src={sub.fullImage || sub.thumbnail}
                          alt={sub.fileName}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-muted" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 print:text-black">
                      <h3 className="font-bold text-lg mb-2 truncate group-hover:text-primary transition-colors print:text-black">{sub.fileName}</h3>
                      <div className="space-y-1">
                        {sub.score?.categories.slice(0, 3).map((cat) => (
                          <div key={cat.name} className="flex items-center justify-between text-xs">
                            <span className="text-muted print:text-gray-600">{cat.name}</span>
                            <span className="font-medium print:text-black">{cat.score}</span>
                          </div>
                        ))}
                      </div>
                      <Link to={`/result/${sub.id}`} className="mt-4 block text-center py-2 bg-primary/10 text-primary rounded-lg text-sm font-semibold hover:bg-primary/20 transition-colors print:hidden">
                        查看詳情
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Exhibition Section */}
        {others.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 print:text-black">
              <ImageIcon className="w-6 h-6 text-primary print:text-gray-800" />
              展覽作品
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {others.map((sub, idx) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.05 }}
                >
                  <Link
                    to={`/result/${sub.id}`}
                    className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all group block print:border-gray-300 print:bg-white"
                  >
                    <div className="relative aspect-square bg-navy/40 overflow-hidden print:bg-gray-100">
                      {sub.thumbnail ? (
                        <img
                          src={sub.thumbnail}
                          alt={sub.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted" />
                        </div>
                      )}
                      <div className="absolute top-1.5 right-1.5">
                        <div className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-white text-xs font-bold shadow-md print:bg-gray-200 print:text-black">
                          {sub.score?.totalScore}
                        </div>
                      </div>
                    </div>
                    <div className="p-2.5 print:text-black">
                      <div className="text-xs font-semibold truncate group-hover:text-primary transition-colors print:text-black">
                        {sub.fileName}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {completed.length === 0 && (
          <div className="text-center py-20 print:hidden">
            <ImageIcon className="w-16 h-16 text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">尚無作品展出</h3>
            <p className="text-muted">請先上傳並評分作品</p>
          </div>
        )}
      </div>
    </div>
  );
}
