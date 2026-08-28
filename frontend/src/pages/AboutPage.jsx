import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, Cpu, MapPin, Users, CheckCircle2, ArrowRight, 
  BarChart3, Globe, Sparkles, Building2, HeartHandshake, Award
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1 rounded-full bg-govblue-50 dark:bg-govblue-950/70 border border-govblue-200 dark:border-govblue-800 text-govblue-700 dark:text-govblue-300 text-[11px] font-extrabold uppercase tracking-widest inline-block">
          About AI Constituency Portal
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
          Reinventing Democratic Governance with Artificial Intelligence
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          A state-of-the-art civic intelligence bridge connecting citizens directly to Members of Parliament, MLAs, and municipal authorities through Multimodal AI.
        </p>
      </div>

      {/* Mission & Vision Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-govblue-100 dark:bg-govblue-900/60 text-govblue-600 dark:text-govblue-300 flex items-center justify-center font-bold text-xl">
              🎯
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              The Mission
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Traditional grievance redressal systems suffer from bureaucratic delays, manual sorting, lack of evidence verification, and linguistic barriers. Our mission is to eliminate these frictions using responsible AI that listens, verifies, categorizes, and tracks every grievance from submission to physical resolution.
            </p>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Voice-first accessibility for every citizen</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>100% automated SLA routing to 17 departments</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Radical transparency with live audit logs</span>
            </li>
          </ul>
        </div>

        <div className="p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-xl">
              🏛️
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
              The Constituency Vision
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              We envision constituencies where elected leaders possess real-time diagnostic heatmaps of water, road, electricity, and health infrastructure issues across every ward, empowering data-driven budget allocation and proactive governance.
            </p>
          </div>
          <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>Data-driven ward-level fund allocation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>Elimination of duplicate grievance tickets</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-indigo-600" />
              <span>Evidence-backed accountability for field contractors</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white p-8 sm:p-12 shadow-xl space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-govblue-400 block mb-1">
            Technology Backbone
          </span>
          <h3 className="text-2xl sm:text-3xl font-extrabold font-['Outfit']">
            Four Pillars of AI Redressal
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2.5">
            <span className="text-2xl">🎙️</span>
            <h4 className="font-bold text-sm text-white font-['Outfit']">Multilingual STT</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Powered by Groq Whisper Cloud API for near-instant transcription of spoken Hindi and English grievance recordings.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2.5">
            <span className="text-2xl">👁️</span>
            <h4 className="font-bold text-sm text-white font-['Outfit']">Multimodal Vision</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Gemini Vision models analyze photographic evidence to detect civic severity and cross-verify with complaint narratives.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2.5">
            <span className="text-2xl">📍</span>
            <h4 className="font-bold text-sm text-white font-['Outfit']">Geospatial Proximity</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Haversine distance algorithms match camera EXIF coordinates with reported locations, flagging off-site uploads.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/70 border border-slate-700/60 space-y-2.5">
            <span className="text-2xl">⚡</span>
            <h4 className="font-bold text-sm text-white font-['Outfit']">Semantic Clustering</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Dense embeddings identify related complaints in the same locality, clustering community problems into unified action plans.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-sm shadow-md transition-all"
        >
          Join Your Constituency Portal Today <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

    </div>
  );
}
