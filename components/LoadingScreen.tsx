"use client";
import React from 'react';
import { LucideShieldCheck } from 'lucide-react';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
            <div className="relative flex flex-col items-center">
                {/* Outer Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />

                {/* Animated Icon Container */}
                <div className="relative w-24 h-24 bg-primary rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 animate-float mb-8">
                    <LucideShieldCheck className="w-12 h-12 text-primary-foreground" />

                    {/* Rotating Ring */}
                    <div className="absolute inset-[-8px] border-2 border-primary/20 border-t-primary rounded-[2.5rem] animate-spin" />
                </div>

                {/* Text and Status */}
                <div className="text-center space-y-2 animate-slide-up">
                    <h2 className="text-xl font-black uppercase tracking-widest tracking-tighter">
                        Presença<span className="text-primary">.Pro</span>
                    </h2>
                    <div className="flex items-center justify-center gap-1">
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
                    </div>
                </div>
            </div>
        </div>
    );
}
