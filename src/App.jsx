import React, { useState } from 'react';

import Navbar from './components/Navbar';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import ComplaintManagement from './pages/ComplaintManagement';
import CitizenTracking from './pages/CitizenTracking';


export default function App() {

  const [activePage, setActivePage] = useState('home');

  // Page Switcher renderer
  const renderPage = () => {

    switch (activePage) {

      case 'home':
        return <Home />;

      case 'dashboard':
        return <Dashboard setActivePage={setActivePage} />;
      case 'tracking':
        return <CitizenTracking setActivePage={setActivePage} />;

      case 'analytics':
        return <Analytics setActivePage={setActivePage} />;

      case 'complaints':
        return (
          <ComplaintManagement
            setActivePage={setActivePage}
          />
        );

      default:
        return <Home />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">

      {/* Top Header Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Pages Switchboard */}
      <div className="flex-grow flex flex-col">
        {renderPage()}
      </div>

      {/* Government Standard Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto text-center text-xs text-slate-400 font-medium">

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-1">

          <p>
            © {new Date().getFullYear()} AI Constituency
            Grievance Redressal System. All Rights Reserved.
          </p>

          <p className="text-[10px] uppercase tracking-widest text-slate-300">
            Powered by FastAPI • MongoDB • AI Semantic Similarity
            Embedding Ranking
          </p>

        </div>

      </footer>

    </div>
  );
}