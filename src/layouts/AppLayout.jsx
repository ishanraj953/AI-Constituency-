import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-['Inter'] transition-colors duration-200">
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

      <Footer />
    </div>
  );
}

