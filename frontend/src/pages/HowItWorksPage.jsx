import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mic, Camera, Cpu, Building2, CheckCircle2, ArrowRight, 
  MapPin, Clock, AlertTriangle, Sparkles, FileText
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Step 1: Citizen Submission (Voice, Text or Camera)',
      subtitle: 'Express your issue naturally without filling lengthy paperwork',
      icon: <Mic className="h-6 w-6 text-govblue-600 dark:text-govblue-400" />,
      badge: 'Multilingual Input',
      details: [
        'Speak in Hindi, English, or mixed dialect for up to 60 seconds.',
        'Upload camera photographs directly capturing the broken road, garbage dump, or water leakage.',
        'Automatic GPS acquisition captures exact longitude/latitude coordinates.'
      ],
      tag: 'Whisper STT'
    },
    {
      num: '02',
      title: 'Step 2: AI Vision & Evidence Verification',
      subtitle: 'Gemini Multimodal Vision validates authentic civic issues',
      icon: <Camera className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />,
      badge: 'AI Vision Verification',
      details: [
        'Gemini Vision inspects the photo to confirm genuine infrastructure issues (rejecting spam/memes).',
        'Semantic Cross-Verifier ensures the photo matches the complaint narrative (e.g. pothole complaint cannot have a cat photo).',
        'Haversine algorithm verifies if photo EXIF GPS matches the reported neighborhood.'
      ],
      tag: 'Gemini Multimodal + EXIF Match'
    },
    {
      num: '03',
      title: 'Step 3: Vector Clustering & Dynamic Priority Ranking',
      subtitle: 'Neighborhood issues are grouped and ranked by hazard level',
      icon: <Cpu className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      badge: 'Embedding Engine',
      details: [
        'Dense vector embeddings group duplicate grievances filed by different neighbors for the same spot.',
        'Calculates a 0-100 Multimodal Priority Score based on urgency, visual severity, and citizen count.',
        'Assigns legal SLA deadlines: 12 Hours for Critical (danger to life), 36 Hours for High priority.'
      ],
      tag: 'sentence-transformers + SLA Rules'
    },
    {
      num: '04',
      title: 'Step 4: Automated Dispatch to 17 Specialized Departments',
      subtitle: 'No manual delays: tickets route directly to municipal divisions',
      icon: <Building2 className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
      badge: 'Intelligent Routing',
      details: [
        'Maps grievance to Roads, Water Supply, Drainage, Sanitation, Power, Lighting, Healthcare, etc.',
        'Designates case file to field engineers and administrative ward officers.',
        'Auto-escalation triggers if the ticket nears SLA deadline without administrative response.'
      ],
      tag: '17 Municipal Divisions'
    },
    {
      num: '05',
      title: 'Step 5: Real-Time Citizen Tracking & Final Resolution',
      subtitle: 'Complete transparency from investigation to repair',
      icon: <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      badge: 'End-to-End Audit',
      details: [
        'Citizens track status in real-time using their unique tracking ID (e.g. CMP-A1B2C3D4).',
        'Field officers record resolution remarks and upload proof of work.',
        'Full activity history is logged permanently for public transparency.'
      ],
      tag: 'Live Audit Log'
    }
  ];

  return (
    <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="px-3.5 py-1 rounded-full bg-govblue-50 dark:bg-govblue-950/70 border border-govblue-200 dark:border-govblue-800 text-govblue-700 dark:text-govblue-300 text-[11px] font-extrabold uppercase tracking-widest inline-block">
          Complete Architectural Guide
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
          How Grievances Travel from Voice to Resolution
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          Learn how our Multimodal AI pipeline ensures every citizen report is verified, prioritized, and redressed without human delays or corruption.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-8 max-w-5xl mx-auto">
        {steps.map((step, idx) => (
          <div 
            key={idx}
            className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start"
          >
            <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
              {step.icon}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-mono font-extrabold text-govblue-600 dark:text-govblue-400 bg-govblue-50 dark:bg-govblue-950 px-2.5 py-1 rounded-lg border border-govblue-200 dark:border-govblue-800">
                  {step.badge}
                </span>
                <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                  Tech: {step.tag}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
                {step.title}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {step.subtitle}
              </p>

              <ul className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                {step.details.map((detail, dIdx) => (
                  <li key={dIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-govblue-600 dark:text-govblue-400 shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="rounded-3xl bg-slate-900 text-white p-8 text-center space-y-4 max-w-4xl mx-auto shadow-xl">
        <h3 className="text-xl sm:text-2xl font-extrabold font-['Outfit']">
          Ready to experience the platform?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
          Submit your first grievance or track an existing complaint right from your computer or phone.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/register"
            className="px-6 py-3 rounded-xl bg-govblue-600 hover:bg-govblue-700 font-bold text-xs shadow-md transition-all"
          >
            Create Citizen Account
          </Link>
          <Link
            to="/track"
            className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 font-bold text-xs transition-all"
          >
            Track A Grievance
          </Link>
        </div>
      </div>

    </div>
  );
}
