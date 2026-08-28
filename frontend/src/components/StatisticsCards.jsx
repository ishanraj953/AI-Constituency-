import React from 'react';

export default function StatisticsCards({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      label: 'Total Complaints',
      value: stats.totalComplaints,
      change: '+14% vs last month',
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-100',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )
    },
    {
      label: 'High Priority',
      value: stats.highPriority,
      change: '+5% this week',
      color: 'text-red-600',
      bg: 'bg-red-50 border-red-100',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      )
    },
    {
      label: 'Medium Priority',
      value: stats.mediumPriority,
      change: '-2% this week',
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-100',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      )
    },
    {
      label: 'Low Priority',
      value: stats.lowPriority,
      change: '+18% this week',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, idx) => (
        <div key={idx} className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-transform hover:-translate-y-0.5 ${c.bg}`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 truncate">
              {c.label}
            </span>
            <div className={`${c.color} flex-shrink-0`}>{c.icon}</div>
          </div>
          
          <div className="mt-3">
            <span className={`text-3xl font-extrabold font-['Outfit'] tracking-tight ${c.color}`}>
              {c.value}
            </span>
            <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wide">
              {c.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

}
