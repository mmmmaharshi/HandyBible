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
	const [bibleDataState, setBibleDataState] = useState(() => {
		const BIBLE_STORAGE_KEY = 'kjv_bible_data';
		const storedBible = localStorage.getItem(BIBLE_STORAGE_KEY);

		if (storedBible) {
			try {
				return JSON.parse(storedBible);
			} catch (error) {
				console.warn('Failed to parse stored Bible data:', error);
				return bibleData;
			}
		}

		return bibleData;
	});

	const books = Object.keys(bibleDataState);

	useEffect(() => {
		const BIBLE_STORAGE_KEY = 'kjv_bible_data';
		const storedBible = localStorage.getItem(BIBLE_STORAGE_KEY);

		if (!storedBible) {
			try {
				localStorage.setItem(BIBLE_STORAGE_KEY, JSON.stringify(bibleData));
				setBibleDataState(bibleData);
				console.log('Bible data saved to localStorage');
			} catch (error) {
				console.warn('Failed to save Bible data to localStorage:', error);
			}
		}
	}, []);

	const [selectedBook, setSelectedBook] = useState<string | null>(() => {
		const saved = localStorage.getItem('selectedBook');
		return saved || books[0] || null;
	});
	const [selectedChapter, setSelectedChapter] = useState<string | null>(() => {
		const saved = localStorage.getItem('selectedChapter');
		return saved || null;
	});

	const [currentVerses, setCurrentVerses] = useState<{
		[verse: string]: string;
	} | null>(null);

	const versesSectionRef = useRef<HTMLElement>(null);

	const getVerses = useCallback(
		(book: string, chapter: string) => {
			if (!bibleDataState[book as keyof typeof bibleDataState]?.[chapter]) {
				return null;
			}
			return bibleDataState[book as keyof typeof bibleDataState][chapter];
		},
		[bibleDataState]
	);

	const chapters = useMemo(() => {
		return selectedBook && selectedBook in bibleDataState
			? Object.keys(
					bibleDataState[selectedBook as keyof typeof bibleDataState]
			  )
			: [];
	}, [selectedBook, bibleDataState]);

	useEffect(() => {
		if (selectedBook) {
			localStorage.setItem('selectedBook', selectedBook);
		}
	}, [selectedBook]);

	useEffect(() => {
		if (selectedChapter) {
			localStorage.setItem('selectedChapter', selectedChapter);
		}
	}, [selectedChapter]);

	useEffect(() => {
		if (selectedBook && selectedChapter) {
			const verses = getVerses(selectedBook, selectedChapter);
			setCurrentVerses(verses);
		} else {
			setCurrentVerses(null);
		}
	}, [selectedBook, selectedChapter, getVerses]);

	// Auto-scroll to top when verses change
	useEffect(() => {
		if (versesSectionRef.current && currentVerses) {
			// Use requestAnimationFrame to ensure DOM is fully rendered
			requestAnimationFrame(() => {
				const firstVerseElement =
					versesSectionRef.current?.querySelector('[data-verse="1"]');

				if (firstVerseElement) {
					// Account for fixed navigation (approx 80px height + padding)
					const navOffset = 120;

					// Calculate the exact position to scroll to
					const elementTop = firstVerseElement.getBoundingClientRect().top;
					const absoluteElementTop = elementTop + window.pageYOffset;
					const scrollToPosition = absoluteElementTop - navOffset;

					window.scrollTo({
						top: scrollToPosition,
						behavior: 'smooth',
					});
				}
			});
		}
	}, [currentVerses]);

	// Navigation functions
	const goToPreviousChapter = () => {
		if (!selectedChapter || !chapters.length) return;

		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex > 0) {
			setSelectedChapter(chapters[currentIndex - 1]);
		}
	};

	const goToNextChapter = () => {
		if (!selectedChapter || !chapters.length) return;

		const currentIndex = chapters.indexOf(selectedChapter);
		if (currentIndex < chapters.length - 1) {
			// Move to next chapter in current book
			setSelectedChapter(chapters[currentIndex + 1]);
		} else {
			// Move to next book
			const currentBookIndex = books.indexOf(selectedBook || '');
			if (currentBookIndex < books.length - 1) {
				// Move to first chapter of next book
				const nextBook = books[currentBookIndex + 1];
				setSelectedBook(nextBook);
				const nextBookChapters = Object.keys(
					bibleDataState[nextBook as keyof typeof bibleDataState]
				);
				setSelectedChapter(nextBookChapters[0]);
			} else {
				// Reached the end - loop back to first book, first chapter
				setSelectedBook(books[0]);
				const firstBookChapters = Object.keys(
					bibleDataState[books[0] as keyof typeof bibleDataState]
				);
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
							disabled={
								!selectedChapter ||
								chapters.indexOf(selectedChapter) === 0
							}>
							<ChevronLeftIcon />
						</Button>
						<div className='w-full flex flex-col items-center gap-2'>
							<Select
								value={selectedBook || ''}
								onValueChange={setSelectedBook}
								disabled={!books.length}>
								<SelectTrigger id='book-select' className='w-full'>
									<SelectValue placeholder='Choose a book' />
								</SelectTrigger>
								<SelectContent>
									{books.map((book) => (
										<SelectItem
											key={book}
											value={book}
											disabled={!books.length}>
											{book}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={selectedChapter || ''}
								onValueChange={setSelectedChapter}
								disabled={!selectedBook || !chapters.length}>
								<SelectTrigger id='chapter-select' className='w-full'>
									<SelectValue placeholder='Choose a chapter' />
								</SelectTrigger>
								<SelectContent>
									{chapters.map((chapter) => (
										<SelectItem
											key={chapter}
											value={chapter}
											disabled={!selectedBook || !chapters.length}>
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
