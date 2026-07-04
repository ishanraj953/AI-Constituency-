import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function PriorityChart({ distribution }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-12 text-xs">
        No priority data loaded.
      </div>
    );
  }

  // Color Mapping: Red (High), Orange (Medium/Warning), Blue/Green (Low)
  const getPriorityColor = (priority) => {
    const norm = (priority || '').toLowerCase();
    if (norm === 'high') return '#ef4444'; // Red
    if (norm === 'medium') return '#f97316'; // Orange
    return '#3b82f6'; // Blue for Low
  };

  const data = distribution.map((item) => ({
    name: item.priority,
    value: item.count
  }));

  const totalComplaints = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between h-[340px] space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800 font-['Outfit']">Priority Segmentation</h3>
        <p className="text-[11px] text-slate-400">Proportion of high, medium, and low severity issues.</p>
      </div>

      <div className="flex-grow min-h-0 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPriorityColor(entry.name)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const pct = totalComplaints > 0 ? ((value / totalComplaints) * 100).toFixed(0) : 0;
                return [`${value} complaints (${pct}%)`, 'Count'];
              }}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                fontWeight: '600'
              }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{
                fontSize: '10px',
                paddingTop: '5px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center overlay total count text */}
        <div className="absolute top-[45%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          <span className="text-xl font-extrabold text-slate-700 font-['Outfit']">{totalComplaints}</span>
        </div>
      </div>
    </div>
  );
}
