import React from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';

interface EnhancedAreaChartProps {
  data: Array<{ date: string; v: number }>;
  title: string;
  color?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#007c89]/30 rounded-md p-3 shadow-lg">
        <p className="text-xs font-semibold text-[#007c89] uppercase mb-1">{label}</p>
        <p className="text-lg font-bebas text-[#181818]">
          {payload[0].value.toLocaleString()} kg
        </p>
      </div>
    );
  }
  return null;
};

export const EnhancedAreaChart: React.FC<EnhancedAreaChartProps> = React.memo(({
  data,
  title,
  color = '#007c89'
}) => {
  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md h-[300px]">
      <p className="text-sm font-bebas text-[#181818] uppercase mb-4 tracking-wider">{title}</p>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${color})`}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6, fill: color }}
          />
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => `${value}kg`}
          />
          <RechartsTooltip content={<CustomTooltip />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

EnhancedAreaChart.displayName = 'EnhancedAreaChart';

interface EnhancedLineChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  color?: string;
}

export const EnhancedLineChart: React.FC<EnhancedLineChartProps> = React.memo(({
  data,
  title,
  color = '#007c89'
}) => {
  return (
    <div className="p-6 rounded-lg bg-white border border-[#007c89]/20 shadow-md h-[300px]">
      <p className="text-sm font-bebas text-[#181818] uppercase mb-4 tracking-wider">{title}</p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <Line
            type="step"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6, fill: color }}
          />
          <CartesianGrid stroke="#E5E7EB" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#6B7280"
            tick={{ fill: '#6B7280', fontSize: 10 }}
            tickFormatter={(value) => `${value}%`}
          />
          <RechartsTooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white border border-[#007c89]/30 rounded-md p-3 shadow-lg">
                    <p className="text-xs font-semibold text-[#007c89] uppercase mb-1">
                      {payload[0].payload.date}
                    </p>
                    <p className="text-lg font-bebas text-[#181818]">
                      {payload[0].value}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

EnhancedLineChart.displayName = 'EnhancedLineChart';

