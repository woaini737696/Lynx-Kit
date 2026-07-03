import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { AlertTriangle, RotateCw } from 'lucide-react-native';
import { captureError } from '@/lib/sentry';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
    captureError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScrollView
          className="flex-1 bg-slate-950"
          contentContainerClassName="items-center justify-center px-6 py-12 gap-4"
        >
          <View className="items-center gap-3">
            <AlertTriangle size={48} color="#EF4444" />
            <Text className="text-lg font-bold text-white">出错了</Text>
            <Text className="text-center text-sm text-slate-400">
              {this.state.error?.message || '应用遇到了意外错误'}
            </Text>
          </View>
          <Pressable
            onPress={this.handleReset}
            className="flex-row items-center gap-2 rounded-xl bg-lynx-500 px-5 py-3 active:opacity-80"
          >
            <RotateCw size={18} color="#FFFFFF" />
            <Text className="text-sm font-semibold text-white">重试</Text>
          </Pressable>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}
