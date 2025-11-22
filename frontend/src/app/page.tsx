import { pageData } from "@/pageData";

export default function Home() {
    return (
        <main className="relative flex h-screen w-full flex-col items-center justify-center py-32 px-16">
			<h1 className="absolute top-[20%] left-1/2 -translate-x-1/2 text-5xl font-bold">{pageData.icon} {pageData.title}</h1>
            <input name="search" placeholder="Search..." className="block w-full max-w-3xl h-16 bg-no-repeat pr-6 pl-14 appearance-none rounded-lg border-2 border-black/20 bg-white focus:border-black outline-2 outline-transparent transition-colors" style={{
				backgroundImage: `url("/search.svg")`,
				backgroundPosition: `left 1.5rem center`,
			}} type="text" />
        </main>
    );
}
