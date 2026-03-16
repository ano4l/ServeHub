"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Repeat2, Search } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
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

function photoForPost(category: string, index: number) {
	const query = encodeURIComponent(`${category} service professional`);
	return `https://picsum.photos/seed/servehub-${index}-${query}/900/1400`;
}

export default function ExplorePage() {
	const router = useRouter();
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
		<div className="min-h-screen bg-[#07111f] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
			<div className="relative mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6">
				<div className="rounded-[24px] border border-white/10 bg-white/8 p-2.5 backdrop-blur-md">
					<AppTabs />
				</div>

				<div className="sticky top-2 z-40 mt-3 rounded-[24px] border border-white/10 bg-[#07111f]/85 px-4 py-4 backdrop-blur-xl">
					<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/48">Explore</p>
					<h1 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">For you</h1>
					<div className="mt-3">
						<Input
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search services or providers..."
							leftIcon={<Search className="h-4 w-4" />}
							className="h-12 rounded-full border-white/8 bg-white text-slate-950 placeholder:text-slate-500"
						/>
					</div>
				</div>

				<div className="mt-3 h-[calc(100vh-14.2rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth pr-1 sm:h-[calc(100vh-15rem)]">
					<div className="space-y-4 pb-10 sm:space-y-6">
						{posts.map((post, index) => (
							<article
								key={post.postId}
								className="relative mx-auto flex min-h-[calc(100vh-16.5rem)] w-full max-w-md snap-center items-end overflow-hidden rounded-[28px] border border-white/10 bg-stone-900 shadow-[0_24px_80px_rgba(15,23,42,0.45)] sm:min-h-[calc(100vh-17.5rem)]"
							>
								<img
									src={photoForPost(post.category, index)}
									alt={`${post.category} service photo`}
									className="absolute inset-0 h-full w-full object-cover"
									loading="lazy"
								/>
								<div className={`absolute inset-0 bg-gradient-to-br opacity-45 ${FEED_BACKDROPS[index % FEED_BACKDROPS.length]}`} />
								<div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.96),rgba(10,10,10,0.24)_55%,rgba(10,10,10,0.08))]" />

								<div className="relative z-10 w-full p-4 sm:p-6">
									<div className="mb-3 flex items-center gap-2">
										<Badge className="rounded-full bg-white text-black hover:bg-white">{post.rating.toFixed(1)} stars</Badge>
										<Badge className="rounded-full border border-white/12 bg-white/10 text-white hover:bg-white/10">{post.category}</Badge>
									</div>

									<h2 className="max-w-sm text-2xl font-semibold leading-tight sm:text-4xl">{post.headline}</h2>
									<p className="mt-2 max-w-sm text-sm leading-6 text-white/84">{post.caption}</p>

									<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
										<button type="button" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18">
											<Heart className="h-4 w-4" />
											<span>{compactCount(post.likes)}</span>
										</button>
										<button type="button" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18">
											<MessageCircle className="h-4 w-4" />
											<span>{compactCount(post.commentsCount)}</span>
										</button>
										<button type="button" className="inline-flex h-10 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18">
											<Repeat2 className="h-4 w-4" />
											<span>{compactCount(post.reposts)}</span>
										</button>
										<button
											type="button"
											className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 hover:bg-white/90"
											onClick={() => router.push("/bookings")}
										>
											<span>Book Now</span>
										</button>
									</div>
								</div>
							</article>
						))}
						{posts.length === 0 ? (
							<div className="mx-auto max-w-md rounded-[24px] border border-white/10 bg-white/8 p-6 text-center text-sm text-white/70 backdrop-blur-md">
								No providers found for your search.
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}
