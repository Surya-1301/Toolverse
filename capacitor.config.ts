import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.toolverse.app',
  appName: 'Toolverse',
  webDir: 'out',
  backgroundColor: '#0f172a',
  android: {
    backgroundColor: '#0f172a',
    allowMixedContent: true,
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#7c3aed',
    },
  },
};

export default config;
