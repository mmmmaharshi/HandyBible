import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';
import webfontDownload from 'vite-plugin-webfont-dl';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler']],
			},
		}),
		webfontDownload(),
		qrcode(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
