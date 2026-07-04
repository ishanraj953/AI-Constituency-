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

export default function TopIssuesChart({ issues }) {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-12 text-xs">
        No issue statistics loaded.
      </div>
    );
  }

  // Display top 10 categories only
  const chartData = issues.slice(0, 10);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between h-[340px] space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800 font-['Outfit']">Primary Constituency Grievances</h3>
        <p className="text-[11px] text-slate-400">Top 10 reported categories sorted descending.</p>
      </div>

      <div className="flex-grow min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={10} />
            <YAxis
              dataKey="category"
              type="category"
              tickLine={false}
              axisLine={false}
              stroke="#475569"
              fontSize={10}
              width={90}
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
            {/* Purple bar for category analysis */}
            <Bar
              name="Grievances"
              dataKey="count"
              fill="#a855f7"
              radius={[0, 4, 4, 0]}
              barSize={14}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
