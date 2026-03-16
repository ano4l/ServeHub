"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Repeat2, Search, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EXPLORE_FEED_FIXTURES, type ExploreFeedFixturePost } from "@/lib/explore-feed-fixtures";
import { SwipeGesture, SafeAreaWrapper } from "@/components/ui/mobile-components";
import { cn } from "@/lib/utils";
import { generateImageUrl, generateFallbackGradient, createImageLoader } from "@/lib/image-utils";

const FEED_BACKDROPS = [
	"from-orange-500 via-rose-500 to-fuchsia-700",
	"from-cyan-500 via-sky-6 to-indigo-700",
	"from-emerald-500 via-teal-600 to-cyan-800",
	"from-amber-400 via-orange-500 to-red-700",
	"from-purple-500 via-pink-600 to-rose-700",
	"from-blue-500 via-indigo-600 to-purple-800",
];

function compactCount(value: number) {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
	return `${value}`;
}

function photoForPost(post: ExploreFeedFixturePost, index: number) {
	// Use the imageUrl from the fixture if available, otherwise generate one
	if (post.imageUrl) {
		return post.imageUrl;
	}
	return generateImageUrl(post.category, index);
}

function getFallbackGradient(category: string) {
	return generateFallbackGradient(category);
}

export default function ExplorePage() {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isSwiping, setIsSwiping] = useState(false);
	const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
	const scrollContainerRef = useRef<HTMLDivElement>(null);

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

	// Auto-scroll to current index
	useEffect(() => {
		if (scrollContainerRef.current && posts.length > 0) {
			const container = scrollContainerRef.current;
			const cardHeight = container.offsetHeight;
			const targetScrollTop = currentIndex * cardHeight;
			
			container.scrollTo({
				top: targetScrollTop,
				behavior: isSwiping ? 'auto' : 'smooth'
			});
		}
	}, [currentIndex, posts.length, isSwiping]);

	// Handle scroll to update current index
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleScroll = () => {
			const cardHeight = container.offsetHeight;
			const newIndex = Math.round(container.scrollTop / cardHeight);
			setCurrentIndex(Math.min(newIndex, posts.length - 1));
		};

		container.addEventListener('scroll', handleScroll, { passive: true });
		return () => container.removeEventListener('scroll', handleScroll);
	}, [posts.length]);

	const handleSwipeUp = () => {
		if (currentIndex < posts.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const handleSwipeDown = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			setCurrentIndex(currentIndex - 1);
		}
	};

	const handleNext = () => {
		if (currentIndex < posts.length - 1) {
			setCurrentIndex(currentIndex + 1);
		}
	};

	const handleCardClick = (post: any, index: number) => {
		setCurrentIndex(index);
		// Navigate to provider details or booking
		router.push(`/providers/${post.providerId || 'demo'}`);
	};

	const handleImageLoad = (index: number) => {
		setLoadedImages(prev => new Set(prev).add(index));
	};

	return (
		<SafeAreaWrapper top bottom className="min-h-screen bg-[#07111f] text-white">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(251,191,36,0.16),transparent_24%)]" />
			<div className="relative mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6">
				<div className="rounded-[24px] border border-white/10 bg-white/8 p-2.5 backdrop-blur-md">
					<AppTabs />
				</div>

				<div className="sticky top-2 z-40 mt-3 rounded-[24px] border border-white/10 bg-[#07111f]/85 px-4 py-4 backdrop-blur-xl">
					<div className="flex items-center justify-between">
						<div className="flex-1">
							<p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/48">Explore</p>
							<h1 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">For you</h1>
						</div>
						{posts.length > 0 && (
							<div className="flex items-center gap-2 text-white/60">
								<ChevronLeft className="h-5 w-5" />
								<span className="text-sm font-medium">{currentIndex + 1}/{posts.length}</span>
								<ChevronRight className="h-5 w-5" />
							</div>
						)}
					</div>
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

				{/* Progress indicator */}
				{posts.length > 0 && (
					<div className="relative mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
						<div 
							className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300 ease-out"
							style={{ width: `${((currentIndex + 1) / posts.length) * 100}%` }}
						/>
					</div>
				)}

				{/* Enhanced swipeable feed */}
				<SwipeGesture
					onSwipeUp={handleSwipeUp}
					onSwipeRight={handleNext}
					className="relative"
				>
					<div 
						ref={scrollContainerRef}
						className="mt-4 h-[calc(100vh-18rem)] snap-y snap-mandatory overflow-y-auto scroll-smooth pr-1 sm:h-[calc(100vh-19rem)]"
						style={{ scrollBehavior: isSwiping ? 'auto' : 'smooth' }}
					>
						<div className="space-y-4 pb-10 sm:space-y-6">
							{posts.map((post, index) => (
								<article
									key={post.postId}
									className={cn(
										"relative mx-auto flex min-h-[calc(100vh-20rem)] w-full max-w-md snap-center items-end overflow-hidden rounded-[28px] border border-white/10 bg-stone-900 shadow-[0_24px_80px_rgba(15,23,42,0.45)] sm:min-h-[calc(100vh-21rem)]",
										"transition-all duration-300 ease-out",
										index === currentIndex ? "scale-100 shadow-2xl" : "scale-95 opacity-60",
										"active:scale-95 cursor-pointer"
									)}
									onClick={() => handleCardClick(post, index)}
								>
									{/* Enhanced image with loading states */}
									<div className="absolute inset-0 bg-stone-800">
										{/* Fallback gradient */}
										<div className={`absolute inset-0 bg-gradient-to-br ${getFallbackGradient(post.category)}`} />
										
										{/* Actual image */}
										<img
											src={photoForPost(post, index)}
											alt={`${post.category} service photo`}
											className={cn(
												"absolute inset-0 h-full w-full object-cover transition-all duration-500",
												loadedImages.has(index) ? "opacity-100" : "opacity-0"
											)}
											loading="lazy"
											onLoad={() => handleImageLoad(index)}
											onError={(e) => {
												// Keep fallback gradient if image fails
												(e.target as HTMLImageElement).style.display = 'none';
											}}
										/>
										
										{/* Loading skeleton */}
										{!loadedImages.has(index) && (
											<div className="absolute inset-0 bg-stone-700 animate-pulse" />
										)}
									</div>
									
									{/* Enhanced gradient overlays */}
									<div className={`absolute inset-0 bg-gradient-to-br opacity-45 ${FEED_BACKDROPS[index % FEED_BACKDROPS.length]}`} />
									<div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(10,10,10,0.96),rgba(10,10,10,0.24)_55%,rgba(10,10,10,0.08))]" />

									{/* Content */}
									<div className="relative z-10 w-full p-4 sm:p-6">
										{/* Enhanced badges */}
										<div className="mb-3 flex items-center gap-2">
											<div className="flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
												<Sparkles className="h-3 w-3 text-yellow-300" />
												<span className="text-xs font-semibold text-white">{post.rating.toFixed(1)}</span>
											</div>
											<Badge className="rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
												{post.category}
											</Badge>
											{post.city && (
												<Badge className="rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20">
													📍 {post.city}
												</Badge>
											)}
										</div>

										<h2 className="max-w-sm text-2xl font-semibold leading-tight sm:text-4xl">{post.headline}</h2>
										<p className="mt-2 max-w-sm text-sm leading-6 text-white/84">{post.caption}</p>

										{/* Enhanced action buttons */}
										<div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
											<button 
												type="button"
												className="inline-flex h-10 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18 active:scale-95 transition-all duration-200"
												onClick={(e) => {
													e.stopPropagation();
													// Handle like action
												}}
											>
												<Heart className="h-4 w-4" />
												<span>{compactCount(post.likes)}</span>
											</button>
											<button 
												type="button"
												className="inline-flex h-10 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18 active:scale-95 transition-all duration-200"
												onClick={(e) => {
													e.stopPropagation();
													// Handle comment action
												}}
											>
												<MessageCircle className="h-4 w-4" />
												<span>{compactCount(post.commentsCount)}</span>
											</button>
											<button 
												type="button"
												className="inline-flex h-10 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/18 active:scale-95 transition-all duration-200"
												onClick={(e) => {
													e.stopPropagation();
													// Handle repost action
												}}
											>
												<Repeat2 className="h-4 w-4" />
												<span>{compactCount(post.reposts)}</span>
											</button>
											<button
												type="button"
												className="inline-flex h-10 min-h-[44px] min-w-[44px] items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-medium text-white hover:from-cyan-500 hover:to-blue-600 active:scale-95 transition-all duration-200 shadow-lg"
												onClick={(e) => {
													e.stopPropagation();
													// Pass provider data to booking workflow
													const bookingData = {
														provider: post.name,
														service: post.category,
														category: post.category,
														price: "Quote on request"
													};
													// Store booking data in session storage for the booking wizard
													sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
													router.push("/book");
												}}
											>
												<span>Book Now</span>
											</button>
										</div>
									</div>
								</article>
							))}
							{posts.length === 0 ? (
								<div className="mx-auto max-w-md rounded-[24px] border border-white/10 bg-white/8 p-6 text-center text-sm text-white/70 backdrop-blur-md">
									<div className="mb-4">
										<Search className="mx-auto h-12 w-12 text-white/30" />
									</div>
									<h3 className="text-lg font-semibold text-white mb-2">No providers found</h3>
									<p>Try adjusting your search terms or browse all services.</p>
								</div>
							) : null}
						</div>
					</div>
				</SwipeGesture>

				{/* Navigation controls */}
				{posts.length > 1 && (
					<div className="fixed bottom-24 left-0 right-0 z-30 flex justify-center gap-4 px-4 safe-area-bottom">
						<button
							onClick={handlePrevious}
							disabled={currentIndex === 0}
							className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
						>
							<ChevronLeft className="h-5 w-5" />
						</button>
						<button
							onClick={handleNext}
							disabled={currentIndex === posts.length - 1}
							className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-200"
						>
							<ChevronRight className="h-5 w-5" />
						</button>
					</div>
				)}
			</div>
		</SafeAreaWrapper>
	);
}
