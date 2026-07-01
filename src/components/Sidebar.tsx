import React from 'react';
import { LayoutDashboard, Send, History, BarChart3, LogOut, Map, X, ListOrdered } from './icons';
import { JalurLogo } from './icons';
import { cn } from '../lib/utils';
import { Role } from '../App';
import { motion, AnimatePresence } from 'motion/react';

export type View = 'dashboard' | 'report' | 'history' | 'analytics' | 'priority';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  role: Role;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, onViewChange, role, onLogout, isOpen, onClose }: SidebarProps) {
  const adminNavItems = [
    { id: 'dashboard', label: 'Ringkasan',            icon: LayoutDashboard },
    { id: 'priority',  label: 'Prioritas Penanganan', icon: ListOrdered },
    { id: 'history',   label: 'Riwayat Laporan',      icon: History },
    { id: 'analytics', label: 'Analitik',             icon: BarChart3 },
  ] as const;

  const wargaNavItems = [
    { id: 'dashboard', label: 'Peta Pemantauan', icon: Map },
    { id: 'report',    label: 'Lapor Cepat',     icon: Send },
    { id: 'history',   label: 'Pantau Laporan',  icon: History },
  ] as const;

  const navItems = role === 'admin' ? adminNavItems : wargaNavItems;

  const handleNavClick = (view: View) => {
    onViewChange(view);
    onClose(); // Close sidebar on mobile after selecting
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] md:hidden"
            style={{ background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 h-screen z-[70] w-72 flex flex-col shrink-0 transition-transform duration-300 ease-out",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div className="p-6 h-20 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <button onClick={onLogout} className="flex items-center gap-2 bg-none border-none cursor-pointer">
            <JalurLogo size={28} />
          </button>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
            style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
          <div className="px-8 mb-3">
            <span className="eyebrow">Navigasi</span>
          </div>
          <nav className="space-y-1 px-4">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={cn(
                    "relative w-full",
                    isActive ? "btn-nav-active" : "btn-ghost"
                  )}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-[20%] bottom-[20%] w-[3px] rounded-r-full"
                      style={{ background: 'var(--color-brand-yellow)' }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <item.icon className={cn(
                    "w-[18px] h-[18px] transition-transform duration-200",
                    isActive ? "scale-110" : ""
                  )} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 space-y-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={() => { onLogout(); onClose(); }} className="btn-ghost hover:!text-red-600 hover:!bg-red-50">
            <LogOut className="w-[18px] h-[18px]" />
            Keluar
          </button>
          
          <div className="p-3.5 rounded-2xl" style={{ background: 'var(--color-surface-cream)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm display-serif",
                role === 'admin' ? "bg-brand-blue text-brand-yellow" : "bg-brand-yellow text-brand-blue"
              )}>
                {role === 'admin' ? 'A' : 'W'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-semibold truncate">
                  {role === 'admin' ? 'Admin Kemang' : 'Warga Kemang'}
                </p>
                <p className="text-xs truncate" style={{ color: 'var(--color-on-surface-muted)' }}>
                  {role === 'admin' ? 'Seksi Pengawasan' : 'Partisipan Publik'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
