import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import DashboardPage from './pages/DashboardPage';
import ComparePage from './pages/ComparePage';
import ExhibitionPage from './pages/ExhibitionPage';

function AppContent() {
  const location = useLocation();
  const isEmbed = location.search.includes('embed=true');

  return (
    <div className={`min-h-screen flex flex-col ${isEmbed ? 'bg-transparent' : ''}`}>
      {!isEmbed && <Navbar />}
      <main className={`flex-1 ${isEmbed ? 'p-0' : ''}`}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/compare/:batchId" element={<ComparePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/exhibition" element={<ExhibitionPage />} />
        </Routes>
      </main>
      {!isEmbed && (
        <footer className="py-6 text-center text-sm text-muted print:hidden border-t border-border mt-auto">
          &copy; 2026 SKWSCOUT All rights reserved.
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
