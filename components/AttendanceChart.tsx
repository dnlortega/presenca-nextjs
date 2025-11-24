"use client";
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = { data: Array<{ date: string; present: number; absent: number }>; };

export default function AttendanceChart({ data }: Props) {
  return (
    <div className="h-72 bg-gradient-to-br from-indigo-50 to-cyan-50 dark:from-black/40 dark:to-white/5 rounded-xl p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="present" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="absent" stroke="#ec4899" strokeWidth={3} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
