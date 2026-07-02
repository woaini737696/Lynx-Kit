import * as React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 全局错误边界
 *
 * 捕获子组件渲染错误，避免整个应用白屏/黑屏。
 * 显示错误信息 + 重试按钮。
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 text-gray-900">
          <div className="text-2xl font-bold">应用遇到错误</div>
          <div className="max-w-md rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {this.state.error?.message ?? "未知错误"}
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            重试
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
