"use client";
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = { data: Array<{ name: string; value: number }>; };

const COLORS = ['#0891b2', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function CompanyDistributionChart({ data }: Props) {
    if (!data || data.length === 0) {
        return (
            <div className="w-full h-72 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl">
                <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
            </div>
        );
    }

    return (
        <div className="w-full" style={{ height: '288px', minHeight: '288px' }}>
            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl p-3">
                <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ color: 'var(--foreground)', fontSize: '12px', fontWeight: 'bold' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
