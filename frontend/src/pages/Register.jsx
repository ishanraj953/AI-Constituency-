import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import { UserPlus, ShieldCheck, Building2, User, Key, CheckCircle2, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get('role') || 'USER').toUpperCase();

  const [role, setRole] = useState(initialRole === 'STAFF' || initialRole === 'ADMIN' ? initialRole : 'USER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Roads & Infrastructure Department');
  const [designation, setDesignation] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const departmentList = [
    'Roads & Infrastructure Department',
    'Water Supply Department',
    'Drainage & Sewerage Board',
    'Sanitation & Waste Management Department',
    'Electrical & Power Department',
    'Street Lighting & Electrical Division',
    'Public Safety & Police Administration',
    'Health & Family Welfare Department',
    'Education & School Infrastructure Department',
    'Transport & Traffic Department',
    'Environment & Pollution Control Board',
    'Horticulture & Parks Department',
    'Housing & Urban Development Authority',
    'Revenue & Land Administration',
    'Food & Civil Supplies Department',
    'Social Welfare & Pensions Department',
    'General Administration'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (role === 'STAFF') {
      if (!department) {
        setError('Please select your assigned Government Department.');
        return;
      }
      if (!secretKey.trim()) {
        setError('Please enter the Staff Security Key provided to your department.');
        return;
      }
    } else if (role === 'ADMIN') {
      if (!secretKey.trim()) {
        setError('Please enter the Administrator Master Security Key.');
        return;
      }
    }

    setIsLoading(true);
    
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        department: role === 'STAFF' ? department : null,
        designation: role === 'STAFF' ? (designation.trim() || 'Department Staff') : null,
        secret_key: (role === 'ADMIN' || role === 'STAFF') ? secretKey.trim() : null
      });

      authLogin(data.access_token, data.user);

      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (data.user.role === 'STAFF') {
        navigate('/admin/complaints');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Registration failed. Please check your details and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full space-y-6 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 transition-colors"
      >
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
            Create Portal Account
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Select your account type below to get started.
          </p>
        </div>

        {/* 3-Way Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setRole('USER'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              role === 'USER'
                ? 'bg-white dark:bg-slate-900 text-govblue-600 dark:text-govblue-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('STAFF'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              role === 'STAFF'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Dept Staff</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole('ADMIN'); setError(''); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              role === 'ADMIN'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>MP / Admin</span>
          </button>
        </div>

        {/* Information Callout */}
        {role === 'USER' && (
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 text-blue-800 dark:text-blue-200 text-xs flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>Public constituent access to submit voice/text grievances and track progress.</span>
          </div>
        )}

        {role === 'STAFF' && (
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 text-indigo-800 dark:text-indigo-200 text-xs flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>Department Officers can review and resolve assigned tickets. Staff Security Key required.</span>
          </div>
        )}

        {role === 'ADMIN' && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0" />
            <span>Full administrative oversight for MP/MLA offices and department triage. Master Key required.</span>
          </div>
        )}
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 p-3 rounded-xl text-xs text-center font-bold">
            ⚠️ {error}
          </motion.div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          
          {/* Common Fields: Name, Email, Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Full Name / Officer Name
            </label>
            <input
              type="text"
              required
              className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
              placeholder={role === 'STAFF' ? 'Er. Rajesh Kumar' : 'John Doe'}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Official / Personal Email Address
            </label>
            <input
              type="email"
              required
              className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
              placeholder={role === 'STAFF' ? 'officer@water.gov.in' : 'citizen@example.com'}
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

          {/* STAFF Specific Fields: Department & Designation */}
          {role === 'STAFF' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Government Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
                >
                  {departmentList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Designation / Role (Optional)
                </label>
                <input
                  type="text"
                  className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
                  placeholder="e.g. Assistant Engineer, Sanitary Inspector, Line Worker"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-1 flex items-center justify-between">
                  <span>Staff Authorization Secret Key</span>
                  <span className="text-[10px] text-slate-400 font-normal">Demo Key: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">STAFF@CONSTITUENCY2026</code></span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-indigo-300 dark:border-indigo-700 bg-indigo-50/40 dark:bg-indigo-950/30 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    placeholder="Enter Staff Key (STAFF@CONSTITUENCY2026)"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* ADMIN Specific Field: Master Key */}
          {role === 'ADMIN' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center justify-between">
                <span>Administrator Master Security Key</span>
                <span className="text-[10px] text-slate-400 font-normal">Demo Key: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">ADMIN@CONSTITUENCY2026</code></span>
              </label>
              <input
                type="password"
                required
                className="appearance-none rounded-xl relative block w-full px-3.5 py-2.5 border border-rose-300 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/30 placeholder-slate-400 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                placeholder="Enter Admin Key (ADMIN@CONSTITUENCY2026)"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
              />
            </motion.div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-bold text-sm shadow-md transition-all disabled:opacity-70 ${
                role === 'ADMIN' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' :
                role === 'STAFF' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                'bg-govblue-600 hover:bg-govblue-700 shadow-govblue-600/20'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              {isLoading ? 'Creating Account...' : `Register as ${role === 'ADMIN' ? 'Administrator' : role === 'STAFF' ? 'Department Officer' : 'Citizen'}`}
            </button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-govblue-600 dark:text-govblue-400 hover:underline">
            Sign in here →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
