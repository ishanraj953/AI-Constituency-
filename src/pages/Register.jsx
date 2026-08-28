import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/api';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const data = await register(name, email, password, role);
      authLogin(data.access_token, data.user);
      if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/user/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200"
      >
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 font-['Outfit']">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Or{' '}
            <Link to="/login" className="font-medium text-govblue-600 hover:text-govblue-500 transition-colors">
              sign in to your existing account
            </Link>
          </p>
        </div>
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
            {error}
          </motion.div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-govblue-500 focus:border-govblue-500 sm:text-sm transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-govblue-500 focus:border-govblue-500 sm:text-sm transition-colors"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 placeholder-slate-500 text-slate-900 focus:outline-none focus:ring-govblue-500 focus:border-govblue-500 sm:text-sm transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role (For Demo Purposes)</label>
              <select
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-govblue-500 focus:border-govblue-500 sm:text-sm transition-colors"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="USER">Citizen</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-govblue-600 hover:bg-govblue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-govblue-500 transition-all disabled:opacity-70"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-govblue-400 group-hover:text-govblue-300" aria-hidden="true" />
              </span>
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
