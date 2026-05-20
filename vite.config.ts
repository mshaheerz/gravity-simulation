import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { voidPlugin } from "void";

export default defineConfig({
  plugins: [voidPlugin(), react()],
  server: {
    host: true,
    port: 5173,
  },
})
