import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-['Inter']">
      <Navbar />

      <div className="flex-grow flex flex-col w-full h-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-grow flex flex-col w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 mt-auto text-center text-xs text-slate-400 font-medium z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-1">
          <p>
            © {new Date().getFullYear()} AI Constituency Grievance Redressal System. All Rights Reserved.
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-300">
            Powered by FastAPI • MongoDB • AI Semantic Similarity Embedding Ranking
          </p>
        </div>
      </footer>
    </div>
  );
}
