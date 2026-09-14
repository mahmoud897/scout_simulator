import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Canvas Error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-editor-bg p-6 text-txt-primary select-none text-center">
          <div className="w-16 h-16 rounded-2xl bg-status-danger/15 border border-status-danger/30 flex items-center justify-center text-2xl mb-4">
            ⚠️
          </div>
          <h3 className="text-base font-bold mb-2">
            {this.props.fallbackTitle || 'حدث خطأ غير متوقع أثناء عرض المشهد ثلاثي الأبعاد'}
          </h3>
          <p className="text-xs text-txt-muted max-w-md mb-6 leading-relaxed">
            تم رصد خطأ غير متوقع وتفاديه لمنع تعطل البرنامج. يمكنك استعادة المشهد فوراً بالنقر أدناه.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="dcc-btn px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-lg hover:bg-accent-hover transition-all active:scale-95"
          >
            🔄 إعادة تحميل المشهد
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
