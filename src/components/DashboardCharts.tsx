'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
  FunnelChart, Funnel, LabelList
} from 'recharts';

interface DashboardChartsProps {
  ventasData: any[];
  productosData: any[];
  vendedoresData: any[];
  funnelData: any[];
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function DashboardCharts({
  ventasData,
  productosData,
  vendedoresData,
  funnelData,
}: DashboardChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 mt-8">
      {/* Ventas por Día/Mes */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Evolución de Ventas</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ventasData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="fecha" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#8b5cf6' }}
              />
              <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productos más vendidos */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Productos Más Vendidos</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={productosData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {productosData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {productosData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              {entry.name} ({entry.value})
            </div>
          ))}
        </div>
      </div>

      {/* Ingresos por vendedor */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Ingresos por Vendedor</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={vendedoresData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
              <Tooltip
                cursor={{ fill: '#ffffff05' }}
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversión de clientes (Funnel / Barras Horizontales) */}
      <div className="glass-panel rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Embudo de Ventas</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px', color: '#fff' }}
              />
              <Funnel
                dataKey="value"
                data={funnelData}
                isAnimationActive
              >
                <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
