import { pageData } from "@/pageData";

export function Navbar() {
    return (
        <nav className="py-2">
			<div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative flex h-16 flex-row items-center justify-between">
				{/* Logo */}
				<a href="/" className="absolute left-[1.6rem] flex items-center gap-3 group">
					<span className="text-3xl transition-transform group-hover:scale-110 duration-200">{pageData.icon}</span>
					<span className="text-xl font-bold text-foreground">{pageData.title}</span>
				</a>
				
				<ul className="hidden w-full items-center justify-center gap-8 lg:flex">
					<li className="font-medium transition-opacity hover:opacity-60 lg:text-[1.1rem]">
						<a href="/"><span>Home</span></a>
					</li>
					<li className="font-medium transition-opacity hover:opacity-60 lg:text-[1.1rem]">
						<a href="/search"><span>Search</span></a>
					</li>
				</ul>
			</div>
		</nav>
    );
}
