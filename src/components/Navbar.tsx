import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Upload, History, LayoutDashboard, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: '首頁', icon: Sparkles },
  { path: '/upload', label: '上傳作品', icon: Upload },
  { path: '/history', label: '歷史紀錄', icon: History },
  { path: '/dashboard', label: '儀表板', icon: LayoutDashboard },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Score<span className="gradient-text">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} className="relative px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                  {isActive && (
                    <motion.div layoutId="nav-active" className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20" transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
                  )}
                  <span className={`relative flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted hover:text-foreground'}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/upload" className="gradient-bg text-white px-5 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
              開始評分
            </Link>
          </div>

          <button className="md:hidden p-2 rounded-xl hover:bg-border/50 transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden glass-card border-t border-border px-4 pb-4 pt-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary/10' : 'text-muted hover:text-foreground hover:bg-border/30'}`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          <Link to="/upload" onClick={() => setMobileOpen(false)} className="mt-2 block text-center gradient-bg text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
            開始評分
          </Link>
        </motion.div>
      )}
    </nav>
  );
}
