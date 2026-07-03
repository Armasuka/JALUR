import React, { useState, useEffect, useRef } from 'react';
import Sidebar, { View } from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import HistoryList from './components/HistoryList';
import LandingPage from './components/LandingPage';
import AdminLogin from './components/AdminLogin';
import PublicMapPage from './components/PublicMapPage';
import AIInfoPage from './components/AIInfoPage';
import HowToPage from './components/HowToPage';
import RDSInfoPage from './components/RDSInfoPage';
import { BarChart3, Menu } from './components/icons';
import AnalyticsView from './components/AnalyticsView';
import PriorityView from './components/PriorityView';
import { motion, AnimatePresence } from 'motion/react';
import { Report } from './types';

export type Role = 'warga' | 'admin' | null;
export type LandingView = 'public-map' | 'ai-info' | 'how-to' | 'rds-info' | null;

// Helper to read persisted state from sessionStorage
function getPersistedRole(): Role {
  try {
    const saved = sessionStorage.getItem('jalur_role');
    if (saved === 'warga' || saved === 'admin') return saved;
  } catch {}
  return null;
}

function getPersistedView(): View {
  try {
    const saved = sessionStorage.getItem('jalur_view');
    if (saved === 'dashboard' || saved === 'report' || saved === 'history' || saved === 'analytics' || saved === 'priority') return saved as View;
  } catch {}
  return 'report';
}

export default function App() {
  const [currentView, setCurrentView] = useState<View>(getPersistedView);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>(getPersistedRole);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [landingView, setLandingView] = useState<LandingView>(null);
  const prevRoleRef = useRef<Role>(role);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Persist role & view to sessionStorage so they survive HMR/page reloads
  useEffect(() => {
    try {
      if (role) {
        sessionStorage.setItem('jalur_role', role);
      } else {
        sessionStorage.removeItem('jalur_role');
      }
    } catch {}
  }, [role]);

  useEffect(() => {
    try {
      sessionStorage.setItem('jalur_view', currentView);
    } catch {}
  }, [currentView]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) {
        console.error('API returned error status:', res.status);
        return; // Don't update reports on server error
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setReports(data);
      } else {
        console.error('API returned non-array data:', data);
      }
    } catch (err) {
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role !== null) {
      // Only reset the view when the role actually changes (not on initial mount from sessionStorage)
      const roleChanged = prevRoleRef.current !== role;
      prevRoleRef.current = role;
      if (roleChanged) {
        if (role === 'admin') {
          setCurrentView('dashboard');
        } else {
          setCurrentView('report');
        }
      }
      fetchReports();
      const interval = setInterval(fetchReports, 10000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const handleStatusChange = async (id: number, newStatus: string) => {
    // Optimistic update - update immediately without waiting for server
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as Report['status'] } : r));

    try {
      const res = await fetch(`/api/reports/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Revert on failure
        fetchReports();
        console.error('Status update failed');
      }
    } catch (error) {
      // Revert on error
      fetchReports();
      console.error(error);
    }
  };

  const handleDetect = async (id: number) => {
    // Optimistic: show detecting state
    setReports(prev => prev.map(r => r.id === id ? { ...r } : r));
    try {
      const response = await fetch(`/api/reports/${id}/detect`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchReports(); // Refresh to get the new RDS and detections
      }
    } catch (error) {
      console.error("Detect error:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        // Remove deleted report from local state
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        console.error('Delete failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEnter = (r: 'warga' | 'admin') => {
    setLandingView(null);
    if (r === 'admin') {
      setShowAdminLogin(true);
    } else {
      prevRoleRef.current = null; // signal that this is a real transition
      setRole('warga');
    }
  };

  if (showAdminLogin) {
    return <AdminLogin onLogin={() => { prevRoleRef.current = null; setRole('admin'); setShowAdminLogin(false); }} onBack={() => { setShowAdminLogin(false); }} />;
  }

  // Sub-pages accessible from landing (no login required)
  if (role === null && landingView !== null) {
    return (
      <AnimatePresence mode="wait">
        {landingView === 'public-map' && (
          <PublicMapPage
            key="public-map"
            onBack={() => setLandingView(null)}
            onEnter={handleEnter}
          />
        )}
        {landingView === 'ai-info' && (
          <AIInfoPage
            key="ai-info"
            onBack={() => setLandingView(null)}
            onEnter={handleEnter}
          />
        )}
        {landingView === 'how-to' && (
          <HowToPage
            key="how-to"
            onBack={() => setLandingView(null)}
            onEnter={handleEnter}
          />
        )}
        {landingView === 'rds-info' && (
          <RDSInfoPage
            key="rds-info"
            onBack={() => setLandingView(null)}
            onNavigateMap={() => setLandingView('public-map')}
            onEnter={handleEnter}
          />
        )}
      </AnimatePresence>
    );
  }

  if (role === null) {
    return <LandingPage
      onEnter={handleEnter}
      onNavigate={(page) => setLandingView(page)}
      onLogoClick={() => { setLandingView(null); }}
    />;
  }

  return (
    <div className="flex min-h-screen font-sans selection:bg-brand-yellow/30 selection:text-brand-blue" style={{ background: 'var(--color-surface-cream)', color: 'var(--color-on-surface)' }}>
      <Sidebar currentView={currentView} onViewChange={setCurrentView} role={role} onLogout={() => { prevRoleRef.current = role; setRole(null); }} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 min-h-screen overflow-hidden overflow-y-auto w-full">
        <header className="h-16 md:h-20 flex items-center px-4 md:px-8 sticky top-0 z-50 gap-3" style={{ background: 'rgba(251, 249, 244, 0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)' }}>
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl shrink-0 transition-colors"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="eyebrow" style={{ fontSize: '12px', color: 'var(--color-on-surface-muted)' }}>
              {role === 'admin' ? 'Admin' : 'Warga'}
            </span>
            <span style={{ color: 'var(--color-border)' }}>/</span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-brand-blue)' }}>
              {currentView === 'dashboard' && (role === 'warga' ? 'Peta Pemantauan' : 'Ringkasan Sistem')}
              {currentView === 'report' && 'Pengiriman Laporan'}
              {currentView === 'history' && (role === 'warga' ? 'Pantau Laporan' : 'Data Riwayat')}
              {currentView === 'analytics' && 'Analisis Mendalam'}
              {currentView === 'priority' && 'Prioritas Penanganan'}
            </span>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <Dashboard reports={reports} role={role} onNavigate={(v) => setCurrentView(v as View)} />}
              {currentView === 'report' && <ReportForm onSuccess={fetchReports} onNavigateMap={() => setCurrentView('dashboard')} onNavigateHistory={() => setCurrentView('history')} />}
              {currentView === 'history' && <HistoryList reports={reports} onStatusChange={handleStatusChange} isAdmin={role === 'admin'} onDetect={handleDetect} onNavigateReport={() => setCurrentView('report')} onDelete={handleDelete} />}
              {currentView === 'analytics' && <AnalyticsView reports={reports} />}
              {currentView === 'priority' && <PriorityView reports={reports} onStatusChange={handleStatusChange} onNavigateHistory={() => setCurrentView('history')} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
