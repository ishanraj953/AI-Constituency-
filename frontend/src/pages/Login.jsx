import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login } from '../services/api';
import { LogIn, ShieldCheck, Building2, User, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await login(email.trim(), password);
      authLogin(data.access_token, data.user);
      
      const userRole = (data.user.role || 'USER').toUpperCase();

      // Dynamic role-based redirection from universal login
      if (userRole === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (userRole === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Invalid email or password. Please verify your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-govblue-50 dark:bg-govblue-950 text-govblue-700 dark:text-govblue-300 text-[10px] font-extrabold uppercase tracking-widest border border-govblue-200 dark:border-govblue-800 mb-2">
            <Sparkles className="h-3 w-3" /> Unified Portal Authentication
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
            Sign In to Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Sign in with your email. The portal automatically routes you based on your role (Municipal Administrator, Department Staff, or Citizen).
          </p>
        </div>
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-xl text-xs text-center font-bold">
            ⚠️ {error}
          </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Registered Email Address
            </label>
            <input
              type="email"
              required
              className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
              placeholder="name@example.com / officer@water.gov.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white bg-govblue-600 hover:bg-govblue-700 font-bold text-sm shadow-md transition-all disabled:opacity-70"
            >
              <LogIn className="h-4 w-4" />
              {isLoading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </div>
        </form>

        {/* Quick Demo Credentials Autofill */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5 text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
            ⚡ Quick Demo Accounts (One-Click Test):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@example.com', 'adminpassword')}
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-left hover:bg-rose-100 transition"
            >
              <span className="font-bold block">🏛️ Municipal Admin</span>
              <span className="text-[10px] text-slate-500">Full Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('rajesh.roads@constituency.gov.in', 'staffpassword')}
              className="p-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 text-left hover:bg-indigo-100 transition"
            >
              <span className="font-bold block">🏢 Roads Staff</span>
              <span className="text-[10px] text-slate-500">Staff Queue</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoCredentials('amit.water@constituency.gov.in', 'staffpassword')}
              className="p-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-left hover:bg-blue-100 transition"
            >
              <span className="font-bold block">🚰 Water Staff</span>
              <span className="text-[10px] text-slate-500">Staff Queue</span>
            </button>
          </div>
        </div>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          New user?{' '}
          <Link to="/register" className="font-bold text-govblue-600 dark:text-govblue-400 hover:underline">
            Register for Citizen, Staff or Admin account →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
