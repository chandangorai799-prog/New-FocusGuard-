import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focusguard.app',
  appName: 'FocusGuard',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // Custom native plugin registrations
  },
};

export default config;
