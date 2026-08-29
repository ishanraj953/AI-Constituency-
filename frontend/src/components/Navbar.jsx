import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LogOut, LayoutDashboard, FileText, BarChart3, ListTodo, MapPin, 
  Moon, Sun, Menu, X, ShieldCheck, Building2, User as UserIcon
} from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = (path, exact = false) => {
    const isActive = exact 
      ? location.pathname === path 
      : location.pathname.startsWith(path);
    return `inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-xs sm:text-sm font-bold transition-all shrink-0 ${
      isActive
        ? 'bg-govblue-50 dark:bg-govblue-950/80 text-govblue-700 dark:text-govblue-300 border border-govblue-200 dark:border-govblue-800 shadow-sm'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-slate-900/80 shadow-sm transition-colors duration-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 flex-nowrap">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2.5 cursor-pointer shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-govblue-600 text-white shadow-md shadow-govblue-600/30">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-govblue-900 dark:text-white font-['Outfit'] block leading-none whitespace-nowrap">
                AI Constituency
              </span>
              <span className="block text-[9px] sm:text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mt-0.5 whitespace-nowrap">
                Grievance Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links - Single Horizontal Row */}
          <nav className="hidden xl:flex items-center space-x-1 whitespace-nowrap flex-nowrap" aria-label="Main Navigation">
            {user ? (
              user.role === 'ADMIN' ? (
                <>
                  <Link to="/" className={navLinkClass('/', true)}>
                    Home
                  </Link>
                  <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                    <LayoutDashboard className="h-4 w-4" />
                    Command Center
                  </Link>
                  <Link to="/admin/complaints" className={navLinkClass('/admin/complaints')}>
                    <ListTodo className="h-4 w-4" />
                    Management
                  </Link>
                  <Link to="/admin/analytics" className={navLinkClass('/admin/analytics')}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                  <Link to="/track" className={navLinkClass('/track')}>
                    Track
                  </Link>
                </>
              ) : user.role === 'STAFF' ? (
                <>
                  <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                    <LayoutDashboard className="h-4 w-4 text-govblue-600 dark:text-govblue-400" />
                    Command Center
                  </Link>
                  <Link to="/staff/dashboard" className={navLinkClass('/staff/dashboard')}>
                    <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    Staff Workspace
                  </Link>
                  <Link to="/admin/analytics" className={navLinkClass('/admin/analytics')}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                  <Link to="/track" className={navLinkClass('/track')}>
                    Track
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/user/dashboard" className={navLinkClass('/user/dashboard')}>
                    <LayoutDashboard className="h-4 w-4" />
                    My Grievances
                  </Link>
                  <Link to="/user/submit" className={navLinkClass('/user/submit')}>
                    <FileText className="h-4 w-4" />
                    Submit Grievance
                  </Link>
                  <Link to="/user/tracking" className={navLinkClass('/user/tracking')}>
                    <MapPin className="h-4 w-4" />
                    Track Complaint
                  </Link>
                </>
              )
            ) : (
              <>
                <Link to="/" className={navLinkClass('/', true)}>
                  Home
                </Link>
                <Link to="/how-it-works" className={navLinkClass('/how-it-works')}>
                  How It Works
                </Link>
                <Link to="/about" className={navLinkClass('/about')}>
                  About
                </Link>
                <Link to="/track" className={navLinkClass('/track')}>
                  Track Grievance
                </Link>
                <Link to="/faq" className={navLinkClass('/faq')}>
                  FAQ
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Section - Single Row */}
          <div className="flex items-center gap-2 shrink-0 flex-nowrap whitespace-nowrap">
            
            {user ? (
              <div className="flex items-center gap-2.5">
                
                {/* User Profile Pill */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className={`h-6 w-6 rounded-lg text-white flex items-center justify-center text-[11px] font-bold ${
                    user.role === 'ADMIN' ? 'bg-rose-600' :
                    user.role === 'STAFF' ? 'bg-indigo-600' : 'bg-govblue-600'
                  }`}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left leading-none">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider mt-0.5 truncate max-w-[130px] text-govblue-600 dark:text-govblue-400">
                      {user.role === 'ADMIN' ? 'Municipal Administrator' :
                       user.role === 'STAFF' ? (user.department ? `${user.department.split(' ')[0]} Staff` : 'Dept Staff') :
                       'Citizen'}
                    </span>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:border-red-800 transition-all text-xs font-bold"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link 
                  to="/login" 
                  className="text-slate-700 dark:text-slate-200 hover:text-govblue-600 dark:hover:text-govblue-400 font-bold text-xs sm:text-sm px-3.5 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  className="bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition-all shadow-sm shadow-govblue-600/20"
                >
                  Register Citizen
                </Link>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Dark Mode"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Mobile Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-2">
          {user ? (
            <div className="space-y-2">
              <div className="px-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                Signed in as: <span className="text-slate-900 dark:text-white font-bold">{user.name} ({user.role})</span>
              </div>
              
              {user.role === 'ADMIN' ? (
                <>
                  <Link 
                    to="/" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Home Overview
                  </Link>
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60"
                  >
                    Command Center
                  </Link>
                  <Link 
                    to="/admin/complaints" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Complaint Management
                  </Link>
                  <Link 
                    to="/admin/analytics" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Analytics & Heatmaps
                  </Link>
                  <Link 
                    to="/track" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Track Grievance
                  </Link>
                </>
              ) : user.role === 'STAFF' ? (
                <>
                  <Link 
                    to="/admin/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60"
                  >
                    Command Center
                  </Link>
                  <Link 
                    to="/staff/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Staff Workspace
                  </Link>
                  <Link 
                    to="/admin/analytics" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Analytics & Heatmaps
                  </Link>
                  <Link 
                    to="/track" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Track Grievance
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/user/dashboard" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950/60"
                  >
                    My Dashboard
                  </Link>
                  <Link 
                    to="/user/submit" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Submit New Grievance
                  </Link>
                  <Link 
                    to="/user/tracking" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Track Complaint
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Home Overview
              </Link>
              <Link 
                to="/how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                How It Works
              </Link>
              <Link 
                to="/about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                About Platform
              </Link>
              <Link 
                to="/track" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Track Grievance
              </Link>
              <Link 
                to="/faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Frequently Asked Questions
              </Link>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <Link 
                  to="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-sm text-slate-800 dark:text-slate-100"
                >
                  Sign In
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center px-4 py-2.5 rounded-xl bg-govblue-600 text-white font-bold text-sm shadow-sm"
                >
                  Register Citizen Account
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}