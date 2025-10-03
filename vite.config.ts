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
			'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&display=swap',
		]),
		qrcode(),
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: [
				'favicon.ico',
				'apple-touch-icon.png',
				'android-chrome-*.png',
			],
			manifest: {
				name: 'HandyBible - KJV Bible Reader',
				short_name: 'HandyBible',
				description:
					'A beautiful, fast, and offline-capable King James Version Bible Reader',
				theme_color: '#ffffff',
				background_color: '#ffffff',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				id: '/',
				screenshots: [
					{
						src: 'android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						form_factor: 'wide',
						label: 'HandyBible Desktop View',
					},
					{
						src: 'android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						form_factor: 'narrow',
						label: 'HandyBible Mobile View',
					},
				],
				icons: [
					{
						src: 'android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
					{
						src: 'apple-touch-icon.png',
						sizes: '180x180',
						type: 'image/png',
					},
					{
						src: 'favicon-16x16.png',
						sizes: '16x16',
						type: 'image/png',
					},
					{
						src: 'favicon-32x32.png',
						sizes: '32x32',
						type: 'image/png',
					},
				],
			},
			workbox: {
				maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
				globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/.*\.json$/,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'bible-data-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
						},
					},
					{
						urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'google-fonts-cache',
							expiration: {
								maxEntries: 10,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
							},
						},
					},
					{
						urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font\.css)$/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'static-font-assets',
							expiration: {
								maxEntries: 4,
								maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
							},
						},
					},
					{
						urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'static-image-assets',
							expiration: {
								maxEntries: 64,
								maxAgeSeconds: 24 * 60 * 60, // 24 hours
							},
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
