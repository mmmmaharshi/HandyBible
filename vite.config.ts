import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { qrcode } from 'vite-plugin-qrcode';
import webfontDownload from 'vite-plugin-webfont-dl';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler']],
			},
		}),
		webfontDownload([
			'https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap',
		]),
		qrcode(),
		VitePWA({ registerType: 'autoUpdate' }),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
