import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import bibleData from './assets/KJV_bible.json';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './components/ui/select';

const App = () => {
	const BIBLE_STORAGE_KEY = 'kjv_bible_data';

	const [bibleDataState, setBibleDataState] = useState(() => {
		const storedBible = localStorage.getItem(BIBLE_STORAGE_KEY);
		if (storedBible) {
			try {
				return JSON.parse(storedBible);
			} catch {
				return bibleData;
			}
		}
		return bibleData;
	});

	const books = Object.keys(bibleDataState);

	// Helper function for safe localStorage operations
	const safeLocalStorage = useMemo(() => ({
		getItem: (key: string): string | null => {
			try {
				return localStorage.getItem(key);
			} catch (error) {
				console.warn(`Failed to read from localStorage: ${key}`, error);
				return null;
			}
		},
		setItem: (key: string, value: string): void => {
			try {
				localStorage.setItem(key, value);
			} catch (error) {
				console.warn(`Failed to write to localStorage: ${key}`, error);
			}
		}
	}), []);

	useEffect(() => {
		const storedBible = safeLocalStorage.getItem(BIBLE_STORAGE_KEY);
		if (!storedBible) {
			safeLocalStorage.setItem(BIBLE_STORAGE_KEY, JSON.stringify(bibleData));
			setBibleDataState(bibleData);
		}
	}, [safeLocalStorage]);

	// Default to first book/chapter if nothing saved
	const [selectedBook, setSelectedBook] = useState<string>(() => {
		const saved = safeLocalStorage.getItem('selectedBook');
		return saved || books[0] || '';
	});

	const chapters = useMemo(() => {
		if (!selectedBook || !bibleDataState[selectedBook]) return [];
		return Object.keys(bibleDataState[selectedBook]).sort(
			(a, b) => Number(a) - Number(b)
		);
	}, [selectedBook, bibleDataState]);

	const [selectedChapter, setSelectedChapter] = useState<string>(() => {
		const saved = safeLocalStorage.getItem('selectedChapter');
		// We'll validate and fix the chapter after books and chapters are loaded
		return saved || '1';
	});

	const [currentVerses, setCurrentVerses] = useState<{
		[verse: string]: string;
	} | null>(null);

	const getVerses = useCallback(
		(book: string, chapter: string) => {
			return bibleDataState[book]?.[chapter] || null;
		},
		[bibleDataState]
	);

	const versesSectionRef = useRef<HTMLElement>(null);
	useEffect(() => {
		if (books.length > 0 && chapters.length > 0) {
			const savedChapter = safeLocalStorage.getItem('selectedChapter');
			if (savedChapter && chapters.includes(savedChapter)) {
				setSelectedChapter(savedChapter);
			} else {
				// If saved chapter doesn't exist in current book, use first chapter
				setSelectedChapter(chapters[0] || '1');
			}
		}
	}, [books.length, chapters, safeLocalStorage]);

	// Persist book & reset chapter to 1 when book changes
	useEffect(() => {
		safeLocalStorage.setItem('selectedBook', selectedBook);
		setSelectedChapter('1');
	}, [selectedBook, safeLocalStorage]);

	// Handle chapter selection validation
	useEffect(() => {
		if (selectedChapter && !chapters.includes(selectedChapter)) {
			setSelectedChapter(chapters[0] || '');
		}
	}, [chapters, selectedChapter]);

	useEffect(() => {
		safeLocalStorage.setItem('selectedChapter', selectedChapter);
	}, [selectedChapter, safeLocalStorage]);

	useEffect(() => {
		if (selectedBook && selectedChapter) {
			const verses = getVerses(selectedBook, selectedChapter);
			setCurrentVerses(verses);
		} else {
			setCurrentVerses(null);
		}
	}, [selectedBook, selectedChapter, getVerses]);

	// Auto-scroll only when chapter changes
	useEffect(() => {
		if (versesSectionRef.current && currentVerses) {
			requestAnimationFrame(() => {
				const firstVerseElement =
					versesSectionRef.current?.querySelector('[data-verse="1"]');
				if (firstVerseElement) {
					const navOffset = 120;
					const elementTop = firstVerseElement.getBoundingClientRect().top;
					const absoluteElementTop = elementTop + window.pageYOffset;
					window.scrollTo({
						top: absoluteElementTop - navOffset,
						behavior: 'smooth',
					});
				}
			});
		}
	}, [currentVerses, selectedBook, selectedChapter]); // scroll only when chapter changes

	const goToPreviousChapter = () => {
		if (!selectedChapter || !chapters.length) return;
		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex > 0) {
			setSelectedChapter(chapters[currentIndex - 1]);
		} else {
			const currentBookIndex = books.indexOf(selectedBook);
			if (currentBookIndex > 0) {
				const prevBook = books[currentBookIndex - 1];
				setSelectedBook(prevBook);
				const prevBookChapters = Object.keys(bibleDataState[prevBook]).sort(
					(a, b) => Number(a) - Number(b)
				);
				setSelectedChapter(prevBookChapters[prevBookChapters.length - 1]);
			}
		}
	};

	const goToNextChapter = () => {
		if (!selectedChapter || !chapters.length) return;
		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex < chapters.length - 1) {
			setSelectedChapter(chapters[currentIndex + 1]);
		} else {
			const currentBookIndex = books.indexOf(selectedBook);
			if (currentBookIndex < books.length - 1) {
				const nextBook = books[currentBookIndex + 1];
				setSelectedBook(nextBook);
				const nextBookChapters = Object.keys(bibleDataState[nextBook]).sort(
					(a, b) => Number(a) - Number(b)
				);
				setSelectedChapter(nextBookChapters[0]);
			} else {
				setSelectedBook(books[0]);
				const firstBookChapters = Object.keys(
					bibleDataState[books[0]]
				).sort((a, b) => Number(a) - Number(b));
				setSelectedChapter(firstBookChapters[0]);
			}
		}
	};

	return (
		<div className='w-full'>
			<nav className='bg-background fixed md:sticky md:top-0 bottom-0 z-50 w-full'>
				<Card className='py-3 w-full rounded-none shadow-none'>
					<CardContent className='flex items-center justify-between gap-5'>
						<Button
							size={'icon'}
							variant={'outline'}
							onClick={goToPreviousChapter}
							disabled={!selectedChapter && chapters.length === 0}>
							<ChevronLeftIcon />
						</Button>
						<div className='w-full flex flex-col items-center gap-2'>
							<Select
								value={selectedBook}
								onValueChange={setSelectedBook}
								disabled={!books.length}>
								<SelectTrigger id='book-select' className='w-full'>
									<SelectValue placeholder='Choose a book' />
								</SelectTrigger>
								<SelectContent>
									{books.map((book) => (
										<SelectItem key={book} value={book}>
											{book}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={selectedChapter}
								onValueChange={setSelectedChapter}
								disabled={!selectedBook || !chapters.length}>
								<SelectTrigger id='chapter-select' className='w-full'>
									<SelectValue placeholder='Choose a chapter' />
								</SelectTrigger>
								<SelectContent>
									{chapters.map((chapter) => (
										<SelectItem key={chapter} value={chapter}>
											Chapter {chapter}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							size={'icon'}
							variant={'outline'}
							onClick={goToNextChapter}
							disabled={!selectedChapter}>
							<ChevronRightIcon />
						</Button>
					</CardContent>
				</Card>
			</nav>
			<section
				ref={versesSectionRef}
				className='py-5 px-4 pb-32 flex flex-col items-start justify-start gap-2 text-base'>
				{currentVerses &&
					Object.entries(currentVerses).map(([verse, text]) => (
						<p key={verse} data-verse={verse}>
							{verse}. {text}
						</p>
					))}
			</section>
		</div>
	);
};

export default App;
