"use client";
import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props { children: React.ReactNode; label?: string; }
interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 text-center p-8 rounded-2xl border border-destructive/20 bg-destructive/5">
          <AlertTriangle className="w-10 h-10 text-destructive/50" />
          <div>
            <p className="font-black text-sm">{this.props.label ?? 'Ocorreu um erro inesperado'}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{this.state.error.message}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => this.setState({ error: null })}>
            <RefreshCw className="w-3.5 h-3.5 mr-2" /> Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
