import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Cpu, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 text-xs transition-colors mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-govblue-600 text-white shadow-md shadow-govblue-600/30">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-govblue-900 dark:text-white font-['Outfit'] block">
                  AI Constituency Portal
                </span>
                <span className="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold -mt-0.5">
                  Citizen Grievance & Constituency Redressal System
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400 max-w-sm">
              Empowering citizens with next-generation Multimodal AI to voice, report, and track civic grievances directly to elected representatives with 100% transparency and automated SLA accountability.
            </p>

            <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-500 dark:text-slate-400 pt-1">
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> Official Municipal Portal
              </span>
              <span className="inline-flex items-center gap-1.5 text-govblue-600 dark:text-govblue-400">
                <Cpu className="h-4 w-4" /> AI Multimodal Verified
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Platform Navigation
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="hover:text-govblue-600 dark:hover:text-govblue-400 transition-colors">
                  Home Overview
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-govblue-600 dark:hover:text-govblue-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-govblue-600 dark:hover:text-govblue-400 transition-colors">
                  About Platform
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-govblue-600 dark:hover:text-govblue-400 transition-colors">
                  Track Grievance
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-govblue-600 dark:hover:text-govblue-400 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Civic Services & Departments */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Key Civic Sectors
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Roads, Bridges & Footpaths</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Clean Drinking Water Supply</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Drainage, Sewage & Monsoon</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Electricity & Street Lighting</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Sanitation & Waste Disposal</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-govblue-500"></span>
                <span>Public Healthcare & Education</span>
              </li>
            </ul>
          </div>

          {/* Citizen Assistance & Login */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">
              Citizen Access
            </h4>
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold px-4 py-2.5 shadow-sm transition-all text-xs"
              >
                Citizen / Official Sign In <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/register"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 font-bold px-4 py-2 text-slate-800 dark:text-slate-200 transition-all text-xs"
              >
                Register Citizen Account
              </Link>
              <p className="text-[11px] text-slate-400">
                Helpline: <strong className="text-slate-700 dark:text-slate-300">1800-CIVIC-AI</strong> (Toll Free)
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & attribution */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 dark:text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} AI Constituency Grievance Redressal System. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Privacy Charter</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Terms of Redressal</span>
            <span className="hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">SLA Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
