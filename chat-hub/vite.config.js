import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/chat-hub/',
  plugins: [react()],
  publicDir: 'assets'
});
