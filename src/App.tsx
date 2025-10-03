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
import { cn } from './lib/utils';

const App = () => {
	const BIBLE_STORAGE_KEY = 'kjv_bible_data';
	const [bibleDataState] = useState(() => {
		const storedBible = localStorage.getItem(BIBLE_STORAGE_KEY);
		if (storedBible) {
			try {
				return JSON.parse(storedBible);
			} catch {
				return bibleData;
			}
		}
		localStorage.setItem(BIBLE_STORAGE_KEY, JSON.stringify(bibleData));
		return bibleData;
	});

	const books = Object.keys(bibleDataState);

	// URL helpers
	const getParam = (key: string) =>
		new URLSearchParams(window.location.search).get(key);
	const setParam = (key: string, value: string) => {
		const params = new URLSearchParams(window.location.search);
		params.set(key, value);
		window.history.replaceState(
			{},
			'',
			`${window.location.pathname}?${params.toString()}`
		);
	};

	const [selectedBook, setSelectedBook] = useState<string>(
		() => getParam('book') || books[0] || ''
	);
	const [selectedChapter, setSelectedChapter] = useState<string>(
		() => getParam('chapter') || '1'
	);
	const [selectedVerse, setSelectedVerse] = useState<string>(
		() => getParam('verse') || '1'
	);
	const [currentVerses, setCurrentVerses] = useState<{
		[verse: string]: string;
	} | null>(null);

	const versesSectionRef = useRef<HTMLElement>(null);
	const scrollOnVerseChangeRef = useRef<boolean>(false);
	const hasScrolledOnLoadRef = useRef<boolean>(false);

	// Wrapper for setSelectedVerse to control scrolling behavior
	const setSelectedVerseWithScroll = useCallback(
		(verse: string, shouldScroll: boolean = false) => {
			scrollOnVerseChangeRef.current = shouldScroll;
			setSelectedVerse(verse);
		},
		[]
	);

	const setSelectedVerseFromText = useCallback(
		(verse: string) => {
			setSelectedVerseWithScroll(verse, false); // Text clicks don't scroll
		},
		[setSelectedVerseWithScroll]
	);

	const setSelectedVerseFromDropdown = useCallback(
		(verse: string) => {
			setSelectedVerseWithScroll(verse, true); // Dropdown selections do scroll
		},
		[setSelectedVerseWithScroll]
	);

	const chapters = useMemo(() => {
		if (!selectedBook || !bibleDataState[selectedBook]) return [];
		return Object.keys(bibleDataState[selectedBook]).sort(
			(a, b) => Number(a) - Number(b)
		);
	}, [selectedBook, bibleDataState]);

	const getVerses = useCallback(
		(book: string, chapter: string) =>
			bibleDataState[book]?.[chapter] || null,
		[bibleDataState]
	);

	// Update URL when book/chapter/verse changes
	useEffect(() => {
		if (selectedBook) setParam('book', selectedBook);
	}, [selectedBook]);
	useEffect(() => {
		if (selectedChapter) setParam('chapter', selectedChapter);
	}, [selectedChapter]);
	useEffect(() => {
		if (selectedVerse) setParam('verse', selectedVerse);
	}, [selectedVerse]);

	// Validate book (case-sensitive, falls back on typos)
	useEffect(() => {
		if (selectedBook && !books.includes(selectedBook)) {
			setSelectedBook(books[0] || '');
		}
	}, [books, selectedBook]);

	// Validate chapter (handles typos like "1a" -> falls back to valid chapter)
	useEffect(() => {
		if (selectedChapter && !chapters.includes(selectedChapter)) {
			setSelectedChapter(chapters[0] || '');
		}
	}, [chapters, selectedChapter]);

	// Validate verse (handles typos like "1a" -> falls back to verse 1)
	useEffect(() => {
		if (selectedVerse && currentVerses && !currentVerses[selectedVerse]) {
			setSelectedVerse('1');
		}
	}, [currentVerses, selectedVerse]);

	// Load verses for current book/chapter
	useEffect(() => {
		if (selectedBook && selectedChapter) {
			setCurrentVerses(getVerses(selectedBook, selectedChapter));
		} else {
			setCurrentVerses(null);
		}
	}, [selectedBook, selectedChapter, getVerses]);

	// Track previous chapter to reset verse 1 on chapter change
	// Remove scrolling, only reset verse selection
	const prevChapterRef = useRef<string | null>(null);
	useEffect(() => {
		if (!selectedChapter) return;

		// Only reset verse, do NOT scroll
		if (
			prevChapterRef.current &&
			prevChapterRef.current !== selectedChapter
		) {
			setSelectedVerse('1'); // highlight verse 1, but no scroll
		}
		prevChapterRef.current = selectedChapter;
	}, [selectedChapter, selectedBook]);

	// Scroll to selected verse when changed (conditional based on source or initial load)
	useEffect(() => {
		if (!selectedVerse || !versesSectionRef.current) return;

		// Scroll on initial load if we haven't scrolled yet and have URL params
		const shouldScrollOnLoad =
			!hasScrolledOnLoadRef.current &&
			getParam('verse') &&
			getParam('book') &&
			getParam('chapter');

		// Scroll if explicitly requested or on initial load
		if (scrollOnVerseChangeRef.current || shouldScrollOnLoad) {
			requestAnimationFrame(() => {
				const el = versesSectionRef.current?.querySelector(
					`[data-verse="${selectedVerse}"]`
				);
				if (el) {
					const nav = document.querySelector('nav');
					const navOffset = nav ? nav.getBoundingClientRect().height : 120;
					const elementTop = el.getBoundingClientRect().top;
					const absoluteElementTop = elementTop + window.pageYOffset;
					window.scrollTo({
						top: absoluteElementTop - navOffset,
						behavior: 'smooth',
					});
				}
				// Mark as scrolled on load or reset the scroll flag
				if (shouldScrollOnLoad) {
					hasScrolledOnLoadRef.current = true;
				} else {
					scrollOnVerseChangeRef.current = false;
				}
			});
		}
	}, [selectedVerse, selectedBook, selectedChapter]);

	const goToPreviousChapter = () => {
		if (!selectedChapter || !chapters.length) return;
		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex > 0) {
			setSelectedChapter(chapters[currentIndex - 1]);
			setSelectedVerseWithScroll('1', true); // Scroll to verse 1 of new chapter
		} else {
			const currentBookIndex = books.indexOf(selectedBook);
			if (currentBookIndex > 0) {
				const prevBook = books[currentBookIndex - 1];
				setSelectedBook(prevBook);
				const prevChapters = Object.keys(bibleDataState[prevBook]).sort(
					(a, b) => Number(a) - Number(b)
				);
				setSelectedChapter(prevChapters[prevChapters.length - 1]);
				setSelectedVerseWithScroll('1', true); // Scroll to verse 1 of new chapter
			}
		}
	};

	const goToNextChapter = () => {
		if (!selectedChapter || !chapters.length) return;
		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex < chapters.length - 1) {
			setSelectedChapter(chapters[currentIndex + 1]);
			setSelectedVerseWithScroll('1', true); // Scroll to verse 1 of new chapter
		} else {
			const currentBookIndex = books.indexOf(selectedBook);
			if (currentBookIndex < books.length - 1) {
				const nextBook = books[currentBookIndex + 1];
				setSelectedBook(nextBook);
				const nextChapters = Object.keys(bibleDataState[nextBook]).sort(
					(a, b) => Number(a) - Number(b)
				);
				setSelectedChapter(nextChapters[0]);
				setSelectedVerseWithScroll('1', true); // Scroll to verse 1 of new chapter
			} else {
				setSelectedBook(books[0]);
				const firstChapters = Object.keys(bibleDataState[books[0]]).sort(
					(a, b) => Number(a) - Number(b)
				);
				setSelectedChapter(firstChapters[0]);
				setSelectedVerseWithScroll('1', true); // Scroll to verse 1 of new chapter
			}
		}
	};

	return (
		<div className='w-full'>
			<nav className='bg-background fixed md:sticky md:top-0 bottom-0 z-50 w-full'>
				<Card className='py-3 w-full rounded-none shadow-none'>
					<CardContent className='flex items-center justify-between gap-5'>
						<Button
							size='icon'
							variant='outline'
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
									{chapters.map((ch) => (
										<SelectItem key={ch} value={ch}>
											Chapter {ch}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={selectedVerse}
								onValueChange={setSelectedVerseFromDropdown}
								disabled={!currentVerses}>
								<SelectTrigger id='verse-select' className='w-full'>
									<SelectValue placeholder='Choose a verse' />
								</SelectTrigger>
								<SelectContent>
									{currentVerses &&
										Object.keys(currentVerses).map((verse) => (
											<SelectItem key={verse} value={verse}>
												Verse {verse}
											</SelectItem>
										))}
								</SelectContent>
							</Select>
						</div>
						<Button
							size='icon'
							variant='outline'
							onClick={goToNextChapter}
							disabled={!selectedChapter}>
							<ChevronRightIcon />
						</Button>
					</CardContent>
				</Card>
			</nav>
			<section
				ref={versesSectionRef}
				className='py-5 pb-32 flex flex-col w-full items-start justify-start gap-2 text-base'>
				{currentVerses &&
					Object.entries(currentVerses).map(([verse, text]) => (
						<p
							key={verse}
							data-verse={verse}
							className={cn(
								verse === selectedVerse
									? 'bg-primary/30 cursor-pointer'
									: 'cursor-pointer',
								'px-3 w-full'
							)}
							onClick={() => setSelectedVerseFromText(verse)}>
							{verse}. {text}
						</p>
					))}
			</section>
		</div>
	);
};

export default App;
