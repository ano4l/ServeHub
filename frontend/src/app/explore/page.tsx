"use client";

import { useMemo, useState } from "react";
import { Heart, MessageCircle, Repeat2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EXPLORE_FEED_FIXTURES } from "@/lib/explore-feed-fixtures";

const FEED_BACKDROPS = [
	"from-orange-500 via-rose-500 to-fuchsia-700",
	"from-cyan-500 via-sky-600 to-indigo-700",
	"from-emerald-500 via-teal-600 to-cyan-800",
	"from-amber-400 via-orange-500 to-red-700",
];

function compactCount(value: number) {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
	return `${value}`;
}

export default function ExplorePage() {
	const [query, setQuery] = useState("");

	const posts = useMemo(() => {
		const search = query.trim().toLowerCase();
		if (!search) {
			return EXPLORE_FEED_FIXTURES;
		}
		return EXPLORE_FEED_FIXTURES.filter((post) =>
			`${post.name} ${post.category} ${post.caption} ${post.city ?? ""}`
				.toLowerCase()
				.includes(search)
		);
	}, [query]);

	return (
		<div className="min-h-screen bg-[#080808] text-white">
			<div className="mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6">
				{/* Move search input outside scroll container for uninterrupted scroll */}
				<div className="sticky top-0 z-40 rounded-[1.7rem] border border-white/10 bg-black/70 px-4 py-4 backdrop-blur-xl">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/48">Explore</p>
					<h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">For you</h1>
					<div className="mt-3">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search services or providers..."
							leftIcon={<Search className="h-4 w-4" />}
							className="h-12 rounded-full border-white/10 bg-white/8 text-white placeholder:text-white/35"
						/>
					</div>
				</div>

				{/* Scroll container below search input */}
				<div className="mt-3 h-[calc(100vh-12rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth pr-1">
					<div className="space-y-6 pb-10">
						{posts.map((post, index) => (
							<article
								key={post.postId}
								className="relative mx-auto flex min-h-[calc(100vh-12rem)] w-full max-w-md snap-center items-end overflow-hidden rounded-[2rem] border border-white/10 bg-stone-900 shadow-[0_24px_80px_rgba(15,23,42,0.45)]"
							>
								<div className={`absolute inset-0 bg-gradient-to-br ${FEED_BACKDROPS[index % FEED_BACKDROPS.length]}`} />
								<div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.97),rgba(10,10,10,0.2)_55%,rgba(10,10,10,0.06))]" />

								<div className="relative z-10 w-full p-5 sm:p-6">
									<div className="mb-3 flex items-center gap-2">
										<Badge className="rounded-full bg-white text-black hover:bg-white">{post.rating.toFixed(1)} stars</Badge>
										<Badge className="rounded-full border border-white/12 bg-white/10 text-white hover:bg-white/10">{post.category}</Badge>
									</div>

									<h2 className="max-w-sm text-3xl font-semibold leading-tight sm:text-4xl">{post.headline}</h2>
									<p className="mt-3 max-w-sm text-sm leading-6 text-white/84">{post.caption}</p>

									<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
										<button type="button" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18">
											<Heart className="h-4 w-4" />
											<span>{compactCount(post.likes)}</span>
										</button>
										<button type="button" className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18">
											<MessageCircle className="h-4 w-4" />
											<span>{compactCount(post.commentsCount)}</span>
										</button>
										{/* Add Book Now button for demo mode */}
										<button
											type="button"
											className="inline-flex items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm text-white hover:bg-green-600"
											onClick={() => alert('Demo: Book Now flow!')}
										>
											<span>Book Now</span>
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
