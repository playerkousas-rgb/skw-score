import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, BarChart3, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 核心功能區 (原 Hero 部分精簡) */}
      <section className="flex-grow relative flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/8 via-accent/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              ScoreAI 智慧評分工具
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold mb-8 tracking-tight">
              用數據 <span className="gradient-text">解讀作品</span>
            </h1>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/upload" className="w-full sm:w-auto gradient-bg text-white px-10 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2">
                <Upload className="w-6 h-6" />
                立即上傳作品
              </Link>
              
              <Link to="/dashboard" className="w-full sm:w-auto px-10 py-4 rounded-2xl text-lg font-bold border border-border bg-card hover:border-primary/30 transition-all flex items-center justify-center gap-2 text-foreground">
                <BarChart3 className="w-6 h-6" />
                查看儀表板
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 底部 Copyright */}
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
