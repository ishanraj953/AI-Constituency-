import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Search, ArrowRight, ShieldCheck } from 'lucide-react';

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      q: 'How does the Voice Grievance recording work?',
      a: 'You can tap the microphone button on the submission form and speak freely in Hindi, English, or your local regional dialect. Our Groq Whisper AI engine automatically listens, transcribes, and extracts key details such as the category, urgency, and affected beneficiaries.'
    },
    {
      q: 'Why is photo evidence required, and how does Gemini AI verify it?',
      a: 'Photo evidence guarantees authentic municipal complaints and prevents false claims. Our Gemini Multimodal AI examines the image to verify that it depicts a real civic problem (e.g. broken road, leaking water pipe, broken streetlight). If a photo is irrelevant (such as a selfie or pet photo) or does not match the complaint description, the system rejects the submission with a clear explanation.'
    },
    {
      q: 'What happens if the photo GPS coordinates do not match my reported place?',
      a: 'If your photo EXIF data indicates the photo was taken at a significantly different location (>2 km) from the reported grievance site (for instance, uploading a photo taken in another city), the complaint is still accepted so you can report issues, but it is flagged with a Location Discrepancy Alert for administrative review.'
    },
    {
      q: 'What are the Service Level Agreement (SLA) deadlines for resolving issues?',
      a: 'SLAs are automatically determined based on urgency and priority: Critical issues (immediate danger to life, bridge collapse, flood, hospital blockage) have a 12-hour SLA deadline. High priority issues have a 36-hour SLA. Medium issues receive a 5-day deadline, and Low priority issues receive a 14-day SLA.'
    },
    {
      q: 'Can I track my grievance without creating an account?',
      a: 'Yes! Anyone can use our Public Tracking tool on the homepage or at /track by entering their unique Complaint ID (e.g. CMP-A1B2C3D4) to view live progress, assigned department, and officer remarks.'
    },
    {
      q: 'Which 17 civic departments are supported by the system?',
      a: 'The system automatically routes complaints to 17 dedicated departments: Roads & Bridges, Water Supply, Drainage & Sewage, Sanitation & Waste Management, Electricity & Power, Street Lighting, Public Safety & Police, Healthcare & Hospitals, Education & Schools, Public Transport & Traffic, Environment & Pollution Control, Parks & Recreation, Housing & Slum Rehabilitation, Revenue & Land Administration, Public Distribution System (PDS), Social Welfare & Pensions, and General Administration.'
    },
    {
      q: 'What should I do if my complaint is marked as overdue or escalated?',
      a: 'When an SLA deadline expires without resolution, our system automatically marks the case as "Overdue" and escalates it to senior administrative officers and the Municipal Commissioner dashboard for immediate intervention.'
    },
    {
      q: 'Is my personal data and identity protected?',
      a: 'Yes. All personal citizen information is stored securely in MongoDB with strict encryption and role-based access control. Public tracking outputs redact citizen IDs and personal identifiers while displaying grievance progress transparently.'
    }
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3.5 py-1 rounded-full bg-govblue-50 dark:bg-govblue-950/70 border border-govblue-200 dark:border-govblue-800 text-govblue-700 dark:text-govblue-300 text-[11px] font-extrabold uppercase tracking-widest inline-block">
          Citizen Help Center
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-['Outfit']">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm">
          Everything you need to know about reporting, AI verification, tracking, and SLA redressals.
        </p>

        {/* Search Bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. voice, photo, SLA, tracking)..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-govblue-500 shadow-sm"
          />
        </div>
      </div>

      {/* Accordion FAQ list */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-xs text-slate-400">
            No questions matched your search query. Try another keyword.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
                    {faq.q}
                  </span>
                  <span className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Still need help CTA */}
      <div className="p-6 rounded-3xl border border-govblue-200 dark:border-govblue-800 bg-govblue-50/50 dark:bg-govblue-950/30 text-center space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white font-['Outfit']">
          Still have questions or need assistance?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Our civic support desk is available 24/7. Call toll-free at <strong>1800-CIVIC-AI</strong> or register an account.
        </p>
        <div className="pt-1">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-govblue-600 hover:bg-govblue-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            Create Citizen Account →
          </Link>
        </div>
      </div>

    </div>
  );
}
