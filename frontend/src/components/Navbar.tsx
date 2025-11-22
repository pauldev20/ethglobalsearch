"use client";

import { pageData } from "@/pageData";
import { useState } from "react";

export function Navbar() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<nav className={`py-2 ${mobileMenuOpen ? "bg-background" : ""}`}>
			<div className="max-w-7xl mx-auto px-6 lg:px-8 w-full relative flex h-16 flex-row items-center justify-between">
				{/* Logo */}
				<a href="/" className="absolute left-[1.6rem] flex items-center gap-3 group">
					<span className="text-3xl transition-transform group-hover:scale-110 duration-200">{pageData.icon}</span>
					<span className="text-xl font-bold text-foreground">{pageData.title}</span>
				</a>

				{/* Mobile Menu Button */}
				<div className="absolute right-8 flex items-center">
					<button
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						className="relative z-20 ml-auto flex h-8 w-8 items-center justify-center lg:hidden cursor-pointer"
					>
						<svg width="32" height="25" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path stroke="currentColor" d="M0 .5h32M0 12.5h32M0 24.5h32"></path>
						</svg>
					</button>
				</div>

				{/* Mobile Menu */}
				<ul
					className={`absolute top-12 left-0 z-50 w-full divide-y divide-border bg-card px-8 py-8 lg:hidden ${mobileMenuOpen ? "block" : "hidden"
						}`}
					style={{
						boxShadow:
							"rgba(50, 50, 93, 0.2) 0px 10px 12px -2px, rgba(0, 0, 0, 0.2) 0px 10px 4px -2px",
					}}
				>
					<div className="py-2">
						<li className="group relative text-left">
							<a
								className="block items-center space-x-3 py-2.5 text-lg font-medium transition-opacity hover:opacity-60"
								href="/"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span>Home</span>
							</a>
						</li>
						<li className="group relative text-left">
							<a
								className="block items-center space-x-3 py-2.5 text-lg font-medium transition-opacity hover:opacity-60"
								href="/search"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span>Search</span>
							</a>
						</li>
						<li className="group relative text-left">
							<a
								className="block items-center space-x-3 py-2.5 text-lg font-medium transition-opacity hover:opacity-60"
								href="/graph"
								onClick={() => setMobileMenuOpen(false)}
							>
								<span>Graph</span>
							</a>
						</li>
					</div>
				</ul>

				{/* Desktop Navigation */}
				<ul className="hidden w-full items-center justify-center gap-8 lg:flex">
					<li className="font-medium transition-opacity hover:opacity-60 lg:text-[1.1rem]">
						<a href="/">
							<span>Home</span>
						</a>
					</li>
					<li className="font-medium transition-opacity hover:opacity-60 lg:text-[1.1rem]">
						<a href="/search">
							<span>Search</span>
						</a>
					</li>
					<li className="font-medium transition-opacity hover:opacity-60 lg:text-[1.1rem]">
						<a href="/graph">
							<span>Graph</span>
						</a>
					</li>
				</ul>
			</div>
		</nav>
	);
}
