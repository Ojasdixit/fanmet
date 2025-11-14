import type { Config } from 'tailwindcss';
import { fanmeetTailwindPreset } from '@fanmeet/theme';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  presets: [fanmeetTailwindPreset as Config],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
