export function SearchBar() {
    return (
        <div className="relative backdrop-blur-xl bg-white/90 rounded-xl sm:rounded-2xl shadow-2xl shadow-purple-500/10 ring-1 ring-black/5 dark:ring-white/10 transition-all duration-300 group-focus-within:shadow-purple-500/20 group-focus-within:ring-purple-500/30">
			<input 
				name="search" 
				placeholder="Search ETHGlobal projects..." 
				className="block w-full h-12 sm:h-14 md:h-16 px-5 pl-14 sm:pl-16 md:pl-20 text-sm sm:text-base md:text-lg appearance-none bg-transparent focus:outline-none transition-all placeholder:text-muted-foreground/60" 
				style={{
					backgroundImage: `url("/search.svg")`,
					backgroundPosition: `left 1.25rem center`,
					backgroundRepeat: 'no-repeat',
					backgroundSize: '18px 18px',
				}} 
				type="text" 
				autoFocus
			/>
		</div>
    );
}
