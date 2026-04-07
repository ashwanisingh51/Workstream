// frontend/src/components/layout/Layout.tsx
import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, Clock, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const Layout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/tasks-history', icon: Clock, label: 'Tasks History' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              <Briefcase className="h-5 w-5 text-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 leading-none">
                Workstream
              </h1>
              <span className="text-[0.65rem] font-medium text-primary/80 tracking-wider uppercase">By ARYAN</span>
            </div>
          </div>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "relative px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10 shadow-[0_0_10px_rgba(0,240,255,0.1)]"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                {({ isActive }) => (
                  <div className="flex items-center gap-2">
                    <item.icon className={cn("h-4 w-4", isActive ? "animate-pulse-glow" : "")} />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_#00f0ff]"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </div>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content Area with Page Transitions */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

export default Layout;
