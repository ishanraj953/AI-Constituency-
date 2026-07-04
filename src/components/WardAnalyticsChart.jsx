import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function WardAnalyticsChart({ wards }) {
  if (!wards || wards.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-12 text-xs">
        No ward analytics loaded.
      </div>
    );
  }

  // Display top 10 wards descending
  const chartData = wards.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between h-[340px] space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800 font-['Outfit']">Regional Ward Reports</h3>
        <p className="text-[11px] text-slate-400">Top 10 location areas sorted by volume.</p>
      </div>

      <div className="flex-grow min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -25, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="ward"
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              fontSize={10}
              dy={5}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
              fontSize={10}
              dx={-5}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '600'
              }}
            />
            {/* Blue bar for general statistics */}
            <Bar
              name="Complaints"
              dataKey="count"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
