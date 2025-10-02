import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<main className='w-full h-svh max-w-xl mx-auto'>
			<App />
		</main>
	</StrictMode>
);
