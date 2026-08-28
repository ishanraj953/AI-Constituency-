import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, FileText, BarChart3, ListTodo, MapPin } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = (path) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-govblue-50 text-govblue-700'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo Section */}
          <Link to={user ? (user.role === 'ADMIN' ? '/admin' : '/user') : '/'} className="flex items-center gap-3 cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-govblue-600 text-white shadow-md shadow-govblue-600/20">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-govblue-900 font-['Outfit'] block sm:inline">
                AI Constituency
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-medium -mt-1">
                Government Portal
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex space-x-1 items-center" aria-label="Tabs">
            
            {user ? (
              <>
                {user.role === 'ADMIN' ? (
                  <>
                    <Link to="/admin/dashboard" className={navLinkClass('/admin/dashboard')}>
                      <LayoutDashboard className="h-4 w-4" />
                      MP Dashboard
                    </Link>
                    <Link to="/admin/complaints" className={navLinkClass('/admin/complaints')}>
                      <ListTodo className="h-4 w-4" />
                      Management
                    </Link>
                    <Link to="/admin/analytics" className={navLinkClass('/admin/analytics')}>
                      <BarChart3 className="h-4 w-4" />
                      Analytics
                    </Link>
                    <Link to="/user/submit" className={navLinkClass('/user/submit')}>
                      <FileText className="h-4 w-4" />
                      New Grievance
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/user/dashboard" className={navLinkClass('/user/dashboard')}>
                      <LayoutDashboard className="h-4 w-4" />
                      My Dashboard
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
                )}
                
                <div className="border-l border-slate-200 h-6 mx-2"></div>
                
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-700">{user.name}</span>
                    <span className="text-[10px] font-medium text-slate-500">{user.role}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium text-sm px-3 py-2">
                  Sign in
                </Link>
                <Link to="/register" className="bg-govblue-600 hover:bg-govblue-700 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
                  Register
                </Link>
              </>
            )}
          </nav>

        </div>
      </div>
    </header>
  );
}