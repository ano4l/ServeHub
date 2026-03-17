"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	Heart,
	MessageCircle,
	Repeat2,
	Search,
	Share2,
	Bookmark,
	Star,
	MapPin,
	CheckCircle2,
	ChevronUp,
	X,
	Send,
} from "lucide-react";
import { AppTabs } from "@/components/navigation/AppTabs";
import { EXPLORE_FEED_FIXTURES, type ExploreFeedFixturePost } from "@/lib/explore-feed-fixtures";
import { cn } from "@/lib/utils";
import { generateImageUrl, generateFallbackGradient } from "@/lib/image-utils";

function compactCount(value: number) {
	if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(".0", "")}M`;
	if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}K`;
	return `${value}`;
}

function photoForPost(post: ExploreFeedFixturePost, index: number) {
	if (post.imageUrl) return post.imageUrl;
	return generateImageUrl(post.category, index);
}

export default function ExplorePage() {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [searchOpen, setSearchOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
	const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
	const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
	const [commentsOpen, setCommentsOpen] = useState(false);
	const [commentText, setCommentText] = useState("");
	const [doubleTapTimer, setDoubleTapTimer] = useState<NodeJS.Timeout | null>(null);
	const [showHeart, setShowHeart] = useState(false);

	const posts = useMemo(() => {
		const search = query.trim().toLowerCase();
		if (!search) return EXPLORE_FEED_FIXTURES;
		return EXPLORE_FEED_FIXTURES.filter((post) =>
			`${post.name} ${post.category} ${post.caption} ${post.city ?? ""}`
				.toLowerCase()
				.includes(search),
		);
	}, [query]);

	// Snap scroll handler
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let scrollTimeout: NodeJS.Timeout;
		const handleScroll = () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				const slideHeight = container.clientHeight;
				const newIndex = Math.round(container.scrollTop / slideHeight);
				setCurrentIndex(Math.max(0, Math.min(newIndex, posts.length - 1)));
			}, 80);
		};

		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => {
			container.removeEventListener("scroll", handleScroll);
			clearTimeout(scrollTimeout);
		};
	}, [posts.length]);

	const scrollToIndex = useCallback(
		(index: number) => {
			const container = containerRef.current;
			if (!container || index < 0 || index >= posts.length) return;
			container.scrollTo({ top: index * container.clientHeight, behavior: "smooth" });
			setCurrentIndex(index);
		},
		[posts.length],
	);

	// Keyboard navigation
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (searchOpen || commentsOpen) return;
			if (e.key === "ArrowDown" || e.key === "j") scrollToIndex(currentIndex + 1);
			if (e.key === "ArrowUp" || e.key === "k") scrollToIndex(currentIndex - 1);
		};
		window.addEventListener("keydown", handleKey);
		return () => window.removeEventListener("keydown", handleKey);
	}, [currentIndex, scrollToIndex, searchOpen, commentsOpen]);

	const toggleLike = (postId: string) => {
		setLikedPosts((prev) => {
			const next = new Set(prev);
			if (next.has(postId)) next.delete(postId);
			else next.add(postId);
			return next;
		});
	};

	const toggleSave = (postId: string) => {
		setSavedPosts((prev) => {
			const next = new Set(prev);
			if (next.has(postId)) next.delete(postId);
			else next.add(postId);
			return next;
		});
	};

	const handleDoubleTap = (postId: string) => {
		if (!likedPosts.has(postId)) {
			toggleLike(postId);
		}
		setShowHeart(true);
		setTimeout(() => setShowHeart(false), 800);
	};

	const handleBookNow = (post: ExploreFeedFixturePost) => {
		sessionStorage.setItem(
			"bookingData",
			JSON.stringify({
				provider: post.name,
				service: post.category,
				category: post.category,
				price: "Quote on request",
			}),
		);
		router.push("/book");
	};

	return (
		<div className="fixed inset-0 bg-black text-white">
			<AppTabs />

			{/* Full-screen vertical snap container */}
			<div
				ref={containerRef}
				className="h-full w-full snap-y snap-mandatory overflow-y-auto scrollbar-none"
			>
				{posts.map((post, index) => {
					const isActive = index === currentIndex;
					const isLiked = likedPosts.has(post.postId);
					const isSaved = savedPosts.has(post.postId);

					return (
						<section
							key={post.postId}
							className="relative h-full w-full snap-start snap-always"
							onClick={(e) => {
								// Double-tap to like
								if (doubleTapTimer) {
									clearTimeout(doubleTapTimer);
									setDoubleTapTimer(null);
									handleDoubleTap(post.postId);
								} else {
									const timer = setTimeout(() => setDoubleTapTimer(null), 300);
									setDoubleTapTimer(timer);
								}
							}}
						>
							{/* Full-bleed background image */}
							<div className="absolute inset-0">
								<div
									className={`absolute inset-0 bg-gradient-to-br ${generateFallbackGradient(post.category)}`}
								/>
								<img
									src={photoForPost(post, index)}
									alt=""
									className={cn(
										"absolute inset-0 h-full w-full object-cover transition-opacity duration-500",
										loadedImages.has(index) ? "opacity-100" : "opacity-0",
									)}
									loading={index < 3 ? "eager" : "lazy"}
									onLoad={() => setLoadedImages((prev) => new Set(prev).add(index))}
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
								{!loadedImages.has(index) && (
									<div className="absolute inset-0 animate-pulse bg-white/5" />
								)}
							</div>

							{/* Gradient overlays */}
							<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40" />

							{/* Double-tap heart animation */}
							{showHeart && isActive && (
								<div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
									<Heart className="h-24 w-24 fill-red-500 text-red-500 animate-ping" />
								</div>
							)}

							{/* Top bar */}
							<div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 safe-area-top">
								<h1 className="text-lg font-bold tracking-tight">Explore</h1>
								<button
									onClick={(e) => {
										e.stopPropagation();
										setSearchOpen(true);
									}}
									className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md active:scale-95"
								>
									<Search className="h-5 w-5" />
								</button>
							</div>

							{/* Right sidebar actions (TikTok style) */}
							<div className="absolute right-3 bottom-40 z-20 flex flex-col items-center gap-5 sm:right-5 sm:bottom-48">
								{/* Provider avatar */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										router.push(`/providers/${post.providerId || "demo"}`);
									}}
									className="relative active:scale-95"
								>
									<div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px]">
										<div className="flex h-full w-full items-center justify-center rounded-full bg-stone-900 text-sm font-bold">
											{post.name.charAt(0)}
										</div>
									</div>
									{post.verified && (
										<CheckCircle2 className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 fill-cyan-400 text-black" />
									)}
								</button>

								{/* Like */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleLike(post.postId);
									}}
									className="flex flex-col items-center active:scale-90 transition-transform"
								>
									<Heart
										className={cn(
											"h-7 w-7 transition-colors",
											isLiked ? "fill-red-500 text-red-500" : "text-white",
										)}
									/>
									<span className="mt-1 text-[11px] font-medium">
										{compactCount(post.likes + (isLiked ? 1 : 0))}
									</span>
								</button>

								{/* Comment */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										setCommentsOpen(true);
									}}
									className="flex flex-col items-center active:scale-90 transition-transform"
								>
									<MessageCircle className="h-7 w-7" />
									<span className="mt-1 text-[11px] font-medium">
										{compactCount(post.commentsCount)}
									</span>
								</button>

								{/* Share/Repost */}
								<button
									onClick={(e) => {
										e.stopPropagation();
									}}
									className="flex flex-col items-center active:scale-90 transition-transform"
								>
									<Repeat2 className="h-7 w-7" />
									<span className="mt-1 text-[11px] font-medium">
										{compactCount(post.reposts)}
									</span>
								</button>

								{/* Bookmark */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleSave(post.postId);
									}}
									className="flex flex-col items-center active:scale-90 transition-transform"
								>
									<Bookmark
										className={cn(
											"h-7 w-7 transition-colors",
											isSaved ? "fill-yellow-400 text-yellow-400" : "text-white",
										)}
									/>
								</button>
							</div>

							{/* Bottom content */}
							<div className="absolute bottom-0 left-0 right-16 z-20 p-4 pb-24 sm:right-20 sm:pb-28">
								{/* Provider info */}
								<div className="flex items-center gap-2 mb-2">
									<span className="font-bold text-sm">{post.name}</span>
									{post.verified && <CheckCircle2 className="h-4 w-4 fill-cyan-400 text-black" />}
									<div className="flex items-center gap-1 text-xs text-white/70">
										<Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
										{post.rating.toFixed(1)}
									</div>
								</div>

								{/* Headline */}
								<h2 className="text-xl font-bold leading-tight sm:text-2xl">
									{post.headline}
								</h2>

								{/* Caption */}
								<p className="mt-2 text-sm text-white/80 line-clamp-2">{post.caption}</p>

								{/* Tags */}
								<div className="mt-2 flex items-center gap-2 flex-wrap">
									<span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
										{post.category}
									</span>
									{post.city && (
										<span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm">
											<MapPin className="h-3 w-3" />
											{post.city}
										</span>
									)}
									{post.availableNow && (
										<span className="rounded-full bg-green-500/20 px-2.5 py-1 text-[11px] font-medium text-green-300">
											Available now
										</span>
									)}
								</div>

								{/* Book Now CTA */}
								<button
									onClick={(e) => {
										e.stopPropagation();
										handleBookNow(post);
									}}
									className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg"
								>
									Book Now
								</button>
							</div>

							{/* Scroll indicator (first slide only) */}
							{index === 0 && isActive && (
								<div className="absolute bottom-28 left-1/2 z-20 -translate-x-1/2 animate-bounce pointer-events-none">
									<ChevronUp className="h-5 w-5 text-white/40 rotate-180" />
								</div>
							)}
						</section>
					);
				})}

				{/* Empty state */}
				{posts.length === 0 && (
					<div className="flex h-full items-center justify-center p-6">
						<div className="text-center">
							<Search className="mx-auto h-12 w-12 text-white/30" />
							<h3 className="mt-4 text-lg font-semibold">No providers found</h3>
							<p className="mt-1 text-sm text-white/60">
								Try adjusting your search terms
							</p>
							<button
								onClick={() => setQuery("")}
								className="mt-4 rounded-full bg-white/10 px-5 py-2 text-sm font-medium"
							>
								Clear search
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Progress dots */}
			{posts.length > 1 && (
				<div className="fixed right-1.5 top-1/2 z-30 -translate-y-1/2 flex flex-col gap-1.5 sm:right-2">
					{posts.slice(0, 8).map((_, i) => (
						<button
							key={i}
							onClick={() => scrollToIndex(i)}
							className={cn(
								"h-1.5 rounded-full transition-all duration-300",
								i === currentIndex ? "w-1.5 bg-white h-5" : "w-1.5 bg-white/30",
							)}
						/>
					))}
				</div>
			)}

			{/* Search overlay */}
			{searchOpen && (
				<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-lg">
					<div className="safe-area-top p-4">
						<div className="flex items-center gap-3">
							<div className="flex-1 relative">
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
								<input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search services, providers, areas..."
									autoFocus
									className="w-full h-12 rounded-full bg-white/10 border border-white/10 pl-12 pr-4 text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400/50"
								/>
							</div>
							<button
								onClick={() => setSearchOpen(false)}
								className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						{query && (
							<div className="mt-4 space-y-2">
								{posts.slice(0, 5).map((post, i) => (
									<button
										key={post.postId}
										onClick={() => {
											scrollToIndex(i);
											setSearchOpen(false);
										}}
										className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left active:bg-white/10"
									>
										<div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-bold">
											{post.name.charAt(0)}
										</div>
										<div className="flex-1 min-w-0">
											<p className="font-medium text-sm truncate">{post.headline}</p>
											<p className="text-xs text-white/50 truncate">
												{post.name} · {post.category} · {post.city}
											</p>
										</div>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* Comments bottom sheet */}
			{commentsOpen && posts[currentIndex] && (
				<div className="fixed inset-0 z-50 flex items-end" onClick={() => setCommentsOpen(false)}>
					<div className="absolute inset-0 bg-black/60" />
					<div
						className="relative w-full max-h-[70vh] rounded-t-3xl bg-[#1a1a2e] p-4 safe-area-bottom"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
						<h3 className="font-semibold mb-4">
							{compactCount(posts[currentIndex].commentsCount)} comments
						</h3>
						<div className="space-y-4 max-h-[50vh] overflow-y-auto pb-16">
							{posts[currentIndex].comments.map((comment) => (
								<div key={comment.id} className="flex gap-3">
									<div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold flex-shrink-0">
										{comment.author.charAt(0)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{comment.author}</span>
											<span className="text-xs text-white/40">{comment.timeAgo}</span>
										</div>
										<p className="text-sm text-white/80 mt-0.5">{comment.text}</p>
									</div>
								</div>
							))}
						</div>
						<div className="absolute bottom-0 left-0 right-0 p-4 bg-[#1a1a2e] border-t border-white/10 safe-area-bottom">
							<div className="flex items-center gap-2">
								<input
									value={commentText}
									onChange={(e) => setCommentText(e.target.value)}
									placeholder="Add a comment..."
									className="flex-1 h-10 rounded-full bg-white/10 border border-white/10 px-4 text-sm text-white placeholder:text-white/40 focus:outline-none"
								/>
								<button className="h-10 w-10 flex items-center justify-center rounded-full bg-cyan-500 active:scale-95">
									<Send className="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
