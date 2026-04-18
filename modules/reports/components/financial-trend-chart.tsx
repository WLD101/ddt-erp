// modules/reports/components/financial-trend-chart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function FinancialTrendChart({ data }: { data: any[] }) {
  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis 
            tickFormatter={(value) => `$${value}`}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              borderRadius: '12px', 
              border: '1px solid #ffffff10',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' 
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Line 
            name="Revenue"
            type="monotone" 
            dataKey="revenue" 
            stroke="#10b981" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: "#10b981", strokeWidth: 0 }}
          />
          <Line 
            name="Purchases"
            type="monotone" 
            dataKey="purchases" 
            stroke="#f59e0b" 
            strokeWidth={2} 
            strokeDasharray="5 5"
            dot={false}
          />
          <Line 
            name="Net Profit"
            type="monotone" 
            dataKey="profit" 
            stroke="#8b5cf6" 
            strokeWidth={3} 
            dot={false}
            activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }}
          />
          <Line 
            name="Expenses"
            type="monotone" 
            dataKey="expenses" 
            stroke="#ef4444" 
            strokeWidth={2} 
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
