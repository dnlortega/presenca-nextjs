"use client";
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = { data: Array<{ name: string; value: number }>; };

const COLORS = ['#0891b2', '#0ea5e9', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

export default function CompanyDistributionChart({ data }: Props) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-72 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl">
                <p className="text-xs text-muted-foreground">Sem dados disponíveis</p>
            </div>
        );
    }

    if (!isMounted) {
        return (
            <div className="w-full h-72 flex items-center justify-center bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl">
                <div className="animate-pulse text-xs text-muted-foreground">Carregando gráfico...</div>
            </div>
        );
    }

    return (
        <div className="w-full bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl p-3">
            <ResponsiveContainer width="100%" height={288}>
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
    );
}
