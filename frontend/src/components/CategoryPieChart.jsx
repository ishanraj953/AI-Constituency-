import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function CategoryPieChart({ distribution }) {
  if (!distribution || distribution.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center text-slate-400 py-12 text-xs">
        No category distribution data loaded.
      </div>
    );
  }

  // Harmonious theme color cell palette supporting all expanded categories
  const COLORS = [
    '#3b82f6', // blue (Roads)
    '#0284c7', // sky blue (Water Supply)
    '#0d9488', // teal (Drainage & Sewage)
    '#10b981', // emerald (Sanitation & Waste)
    '#f59e0b', // amber (Electricity & Power)
    '#eab308', // yellow (Street Lighting)
    '#ef4444', // red (Public Safety)
    '#f43f5e', // rose (Healthcare)
    '#8b5cf6', // violet (Education)
    '#6366f1', // indigo (Public Transport)
    '#14b8a6', // light teal (Environment)
    '#84cc16', // lime (Parks & Recreation)
    '#d97706', // warm amber (Housing & Slums)
    '#a855f7', // purple (Revenue & Land)
    '#ec4899', // pink (PDS / Ration)
    '#06b6d4', // cyan (Social Welfare)
    '#64748b'  // slate (Other / General)
  ];

  // Map label formatter to append percentage inside list
  const data = distribution.map((item, idx) => ({
    name: item.category,
    value: item.count,
    percentage: item.percentage
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.08 ? (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="text-[9px] font-bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between h-[340px] space-y-4">
      <div>
        <h3 className="text-base font-bold text-slate-800 dark:text-white font-['Outfit']">Grievance Distribution</h3>
        <p className="text-[11px] text-slate-400">Percentage contribution of municipal problems.</p>
      </div>

      <div className="flex-grow min-h-0 w-full relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={85}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [`${value} complaints (${props.payload.percentage}%)`, name]}
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
      </div>
    </div>
  );
}
