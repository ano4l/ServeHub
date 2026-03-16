export interface ExploreFeedFixtureComment {
  id: string;
  author: string;
  handle: string;
  text: string;
  timeAgo: string;
}

export interface ExploreFeedFixturePost {
  postId: string;
  providerId: string;
  name: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  category: string;
  caption: string;
  city?: string;
  hashtags: string[];
  publishedAt: string;
  mediaType: "video" | "photo";
  likes: number;
  commentsCount: number;
  reposts: number;
  comments: ExploreFeedFixtureComment[];
  availableNow: boolean;
  headline: string;
  likedByViewer?: boolean;
  repostedByViewer?: boolean;
}

export const EXPLORE_FEED_FIXTURES: ExploreFeedFixturePost[] = [
  {
    postId: "sample-plumbing-midrand",
    providerId: "sample-provider-plumbing",
    name: "Mpho Flow Fix",
    rating: 4.9,
    reviewCount: 248,
    verified: true,
    category: "Plumbing",
    caption:
      "Burst geyser at 7am, hot water back before breakfast. Tonight's emergency slots are still open across Midrand and Waterfall.",
    city: "Midrand",
    hashtags: ["#Plumbing", "#EmergencyFix", "#Midrand"],
    publishedAt: "Trending",
    mediaType: "video",
    likes: 18200,
    commentsCount: 142,
    reposts: 430,
    comments: [
      {
        id: "sample-plumbing-comment-1",
        author: "Lerato",
        handle: "@lerato",
        text: "This is exactly the kind of before-and-after post I want in the feed.",
        timeAgo: "18m ago",
      },
      {
        id: "sample-plumbing-comment-2",
        author: "Sam K",
        handle: "@sam",
        text: "Love that the arrival time and price range are clear right in the caption.",
        timeAgo: "41m ago",
      },
    ],
    availableNow: true,
    headline: "Emergency plumbing in Midrand",
  },
  {
    postId: "sample-electrical-sandton",
    providerId: "sample-provider-electrical",
    name: "Nandi Spark Works",
    rating: 4.8,
    reviewCount: 191,
    verified: true,
    category: "Electrical",
    caption:
      "Generator changeover install wrapped before load-shedding kicked in. Weekend diagnostics are open for homes and small offices in Sandton.",
    city: "Sandton",
    hashtags: ["#Electrical", "#BackupPower", "#Sandton"],
    publishedAt: "2h ago",
    mediaType: "photo",
    likes: 12600,
    commentsCount: 88,
    reposts: 302,
    comments: [
      {
        id: "sample-electrical-comment-1",
        author: "Priya",
        handle: "@priya",
        text: "The checklist overlay makes this feel like a real short-form service ad.",
        timeAgo: "22m ago",
      },
      {
        id: "sample-electrical-comment-2",
        author: "Theo",
        handle: "@theo",
        text: "Instantly understandable. I would tap through from this.",
        timeAgo: "1h ago",
      },
    ],
    availableNow: true,
    headline: "Backup power upgrades in Sandton",
    likedByViewer: true,
  },
  {
    postId: "sample-cleaning-rosebank",
    providerId: "sample-provider-cleaning",
    name: "Fresh Fold Crew",
    rating: 4.7,
    reviewCount: 164,
    verified: false,
    category: "Cleaning",
    caption:
      "Turnover clean for a two-bedroom flat, filmed in one take so customers can see the pace, products, and final walkthrough.",
    city: "Rosebank",
    hashtags: ["#Cleaning", "#MoveOutClean", "#Rosebank"],
    publishedAt: "Fresh today",
    mediaType: "video",
    likes: 9400,
    commentsCount: 61,
    reposts: 177,
    comments: [
      {
        id: "sample-cleaning-comment-1",
        author: "Amahle",
        handle: "@amahle",
        text: "The pacing on this one feels very explore-feed ready.",
        timeAgo: "9m ago",
      },
      {
        id: "sample-cleaning-comment-2",
        author: "Jordan",
        handle: "@jordan",
        text: "Sample or not, I can actually try the UI with this. Much better.",
        timeAgo: "37m ago",
      },
    ],
    availableNow: true,
    headline: "Move-out cleaning in Rosebank",
  },
  {
    postId: "sample-gardening-pretoria-east",
    providerId: "sample-provider-gardening",
    name: "Greenline Gardens",
    rating: 4.9,
    reviewCount: 207,
    verified: true,
    category: "Gardening",
    caption:
      "From overgrown to event-ready in one afternoon. Lawn edging, hedge shaping, and a fast seasonal planting plan for Pretoria East homes.",
    city: "Pretoria East",
    hashtags: ["#Gardening", "#LawnCare", "#PretoriaEast"],
    publishedAt: "Popular now",
    mediaType: "photo",
    likes: 15400,
    commentsCount: 94,
    reposts: 286,
    comments: [
      {
        id: "sample-gardening-comment-1",
        author: "Nokuthula",
        handle: "@nokuthula",
        text: "The category mix is good. This helps the feed feel alive instead of empty.",
        timeAgo: "14m ago",
      },
      {
        id: "sample-gardening-comment-2",
        author: "Chris",
        handle: "@chris",
        text: "This would be a strong card to test likes and comments against.",
        timeAgo: "53m ago",
      },
    ],
    availableNow: true,
    headline: "Garden refresh in Pretoria East",
    repostedByViewer: true,
  },
  {
    postId: "sample-painting-centurion",
    providerId: "sample-provider-painting",
    name: "Prime Coat Studio",
    rating: 4.6,
    reviewCount: 132,
    verified: false,
    category: "Painting",
    caption:
      "Quick hallway repaint with sharp trim lines, low-odor paint, and a same-week booking window for apartment touch-ups in Centurion.",
    city: "Centurion",
    hashtags: ["#Painting", "#ApartmentRefresh", "#Centurion"],
    publishedAt: "3h ago",
    mediaType: "video",
    likes: 7800,
    commentsCount: 49,
    reposts: 140,
    comments: [
      {
        id: "sample-painting-comment-1",
        author: "Yusuf",
        handle: "@yusuf",
        text: "The captions feel concrete enough that the cards are believable.",
        timeAgo: "27m ago",
      },
      {
        id: "sample-painting-comment-2",
        author: "Mia",
        handle: "@mia",
        text: "Good filler content while the real feed is still thin.",
        timeAgo: "1h ago",
      },
    ],
    availableNow: false,
    headline: "Apartment painting in Centurion",
  },
  {
    postId: "sample-hvac-fourways",
    providerId: "sample-provider-hvac",
    name: "Heatwave HVAC Co",
    rating: 4.8,
    reviewCount: 176,
    verified: true,
    category: "HVAC",
    caption:
      "Split-unit deep clean plus airflow balancing for a small office. Booked, filmed, and wrapped before lunch in Fourways.",
    city: "Fourways",
    hashtags: ["#HVAC", "#ACService", "#Fourways"],
    publishedAt: "Just added",
    mediaType: "photo",
    likes: 11100,
    commentsCount: 73,
    reposts: 212,
    comments: [
      {
        id: "sample-hvac-comment-1",
        author: "Kayla",
        handle: "@kayla",
        text: "This is the kind of niche service content that makes an explore feed feel real.",
        timeAgo: "11m ago",
      },
      {
        id: "sample-hvac-comment-2",
        author: "Bongani",
        handle: "@bongani",
        text: "Nice balance between utility and social-feed energy.",
        timeAgo: "46m ago",
      },
    ],
    availableNow: true,
    headline: "Office AC tune-up in Fourways",
  },
];
