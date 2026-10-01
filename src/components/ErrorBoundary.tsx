import React, { Component, ErrorInfo, ReactNode } from "react";
import { Sparkles, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[APP_CRASH_CAUGHT_BY_BOUNDARY]", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-6 text-white font-serif">
          <div className="w-16 h-16 rounded-full border border-amber-500/30 flex items-center justify-center text-amber-500 bg-amber-500/10 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
            <Sparkles size={32} />
          </div>

          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl text-amber-400 font-bold tracking-wider">
              As energias oscilaram
            </h2>
            <p className="text-sm text-white/60 font-sans leading-relaxed">
              Ocorreu uma instabilidade transitória na sintonia da página. Cigano Pablo convida você a restabelecer a conexão.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-sans font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <RefreshCw size={16} />
            Recarregar Portal
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
