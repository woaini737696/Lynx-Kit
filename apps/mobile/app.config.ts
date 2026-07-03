import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '妙想',
  slug: 'lynxkit',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'lynxkit',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0F172A',
  },
  ios: {
    bundleIdentifier: 'com.lynxkit.app',
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: '用于扫描商品码和上传图片',
    },
  },
  android: {
    package: 'com.lynxkit.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0F172A',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: ['expo-router', 'expo-secure-store', 'expo-notifications'],
  experiments: { tsconfigPaths: true },
});
