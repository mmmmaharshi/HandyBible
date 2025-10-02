const NavBar = () => {
	return (
		<div className='fixed inset-x-0 top-0 z-10 px-4'>
			<nav className='max-w-xl mx-auto flex bg-background items-center gap-3 h-12 justify-between'>
				<h1 className='font-bold text-2xl text-primary'>Habit Anchor</h1>
			</nav>
		</div>
	);
};

export default NavBar;
