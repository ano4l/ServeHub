export interface DemoHomeService {
  id: string;
  title: string;
  subtitle: string;
  eta: string;
  accent: string;
  badge: string;
  imageUrl: string;
}

export interface DemoOrderHistory {
  id: string;
  title: string;
  provider: string;
  date: string;
  price: string;
}

export interface DemoBookingMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  own?: boolean;
}

export interface DemoBooking {
  id: string;
  service: string;
  provider: string;
  providerRole: string;
  status: "Arriving" | "In Progress" | "Scheduled";
  eta: string;
  scheduledFor: string;
  price: string;
  address: string;
  progress: number;
  accent: string;
  imageUrl: string;
  avatarUrl: string;
  checklist: { label: string; complete: boolean }[];
  thread: DemoBookingMessage[];
}

export interface DemoFeedComment {
  id: string;
  author: string;
  handle: string;
  text: string;
}

export interface DemoFeedPost {
  id: string;
  provider: string;
  category: string;
  headline: string;
  caption: string;
  stats: {
    likes: string;
    comments: string;
    reposts: string;
  };
  accent: string;
  location: string;
  rating: number;
  reviews: number;
  avatarUrl: string;
  imageUrl: string;
  hashtags: string[];
  comments: DemoFeedComment[];
  moments: string[];
}

export interface DemoProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  neighborhood: string;
  verified: boolean;
  caption: string;
  avatarUrl: string;
}

export interface DemoProfileSectionItem {
  id: string;
  label: string;
  value: string;
}

export const homeServices: DemoHomeService[] = [
  {
    id: "service-1",
    title: "Emergency plumbing",
    subtitle: "Leaks, geysers, blockages",
    eta: "12 min",
    accent: "from-cyan-300 via-sky-400 to-blue-700",
    badge: "Most booked",
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-2",
    title: "Deep cleaning",
    subtitle: "Same-day home refresh",
    eta: "22 min",
    accent: "from-amber-200 via-orange-400 to-rose-600",
    badge: "Top rated",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-3",
    title: "Electrical fixes",
    subtitle: "Diagnostics and repair",
    eta: "18 min",
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    badge: "Fast arrival",
    imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-4",
    title: "Garden care",
    subtitle: "Weekly and urgent jobs",
    eta: "35 min",
    accent: "from-lime-300 via-emerald-400 to-teal-700",
    badge: "Weekend special",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-5",
    title: "Hair styling",
    subtitle: "Braids, cuts, silk press",
    eta: "28 min",
    accent: "from-fuchsia-300 via-pink-500 to-rose-700",
    badge: "Beauty favorite",
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-6",
    title: "Dog washing",
    subtitle: "Mobile grooming at home",
    eta: "24 min",
    accent: "from-orange-200 via-amber-400 to-yellow-600",
    badge: "Pet care",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-7",
    title: "Pool cleaning",
    subtitle: "Vacuum, skim, chemical check",
    eta: "31 min",
    accent: "from-sky-300 via-cyan-500 to-teal-700",
    badge: "Summer ready",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-8",
    title: "Dog walking",
    subtitle: "Daily, lunchtime, and evening",
    eta: "16 min",
    accent: "from-emerald-300 via-lime-400 to-green-700",
    badge: "Near you",
    imageUrl: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-9",
    title: "Makeup artist",
    subtitle: "Soft glam, events, bridal",
    eta: "42 min",
    accent: "from-rose-200 via-pink-400 to-fuchsia-700",
    badge: "Booked this week",
    imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-10",
    title: "Nail technician",
    subtitle: "Gel, acrylic, and nail art",
    eta: "26 min",
    accent: "from-violet-300 via-purple-500 to-pink-700",
    badge: "Salon at home",
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-11",
    title: "Car wash",
    subtitle: "Interior and exterior detail",
    eta: "19 min",
    accent: "from-slate-200 via-sky-400 to-blue-700",
    badge: "Express",
    imageUrl: "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "service-12",
    title: "Massage therapy",
    subtitle: "Sports, recovery, in-home",
    eta: "37 min",
    accent: "from-stone-200 via-amber-300 to-orange-500",
    badge: "Wellness",
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
  },
];

export const orderHistory: DemoOrderHistory[] = [
  { id: "history-1", title: "Carpet refresh", provider: "Lindiwe Clean Studio", date: "Tue 4 Mar", price: "R520" },
  { id: "history-2", title: "Ceiling fan install", provider: "Jason Electrical", date: "Fri 28 Feb", price: "R780" },
  { id: "history-3", title: "Patio pressure wash", provider: "Coastline Wash", date: "Sun 16 Feb", price: "R690" },
];

export const demoBookings: DemoBooking[] = [
  {
    id: "booking-1",
    service: "Burst geyser repair",
    provider: "Nomvula Plumbing Co.",
    providerRole: "Emergency plumbing",
    status: "Arriving",
    eta: "11 min",
    scheduledFor: "Today, 10:00",
    price: "R850",
    address: "14 Beach Road, Sea Point",
    progress: 74,
    accent: "from-cyan-300 via-sky-500 to-blue-700",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    checklist: [
      { label: "Request submitted", complete: true },
      { label: "Quote approved", complete: true },
      { label: "Provider en route", complete: true },
      { label: "Repair complete", complete: false },
    ],
    thread: [
      { id: "t1", sender: "Nomvula", text: "I can be there in 12 minutes. Please share a gate code if needed.", time: "09:14" },
      { id: "t2", sender: "You", text: "Gate code is 1946. Please check the geyser pressure valve too.", time: "09:16", own: true },
      { id: "t3", sender: "Nomvula", text: "Perfect. I have the replacement parts in the van already.", time: "09:17" },
    ],
  },
  {
    id: "booking-2",
    service: "Move-out deep clean",
    provider: "Lindiwe Clean Studio",
    providerRole: "Cleaning crew",
    status: "Scheduled",
    eta: "Tomorrow",
    scheduledFor: "Tomorrow, 08:30",
    price: "R1,240",
    address: "4 Loader Street, De Waterkant",
    progress: 38,
    accent: "from-amber-200 via-orange-400 to-rose-600",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    checklist: [
      { label: "Request submitted", complete: true },
      { label: "Provider confirmed", complete: true },
      { label: "Access details shared", complete: false },
      { label: "Service complete", complete: false },
    ],
    thread: [
      { id: "t4", sender: "Lindiwe", text: "We are set for 08:30. Do you want oven cleaning added to the package?", time: "08:02" },
      { id: "t5", sender: "You", text: "Yes please, add that in.", time: "08:06", own: true },
    ],
  },
  {
    id: "booking-3",
    service: "Kitchen plug repair",
    provider: "Jason Electrical",
    providerRole: "Electrical diagnostics",
    status: "In Progress",
    eta: "On-site",
    scheduledFor: "Today, 07:45",
    price: "R680",
    address: "92 Kloof Street, Gardens",
    progress: 89,
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    checklist: [
      { label: "Request submitted", complete: true },
      { label: "Provider accepted", complete: true },
      { label: "Diagnostics underway", complete: true },
      { label: "Repair complete", complete: false },
    ],
    thread: [
      { id: "t6", sender: "Jason", text: "The fault is isolated to one outlet. I should be done in 20 minutes.", time: "07:58" },
    ],
  },
];

export const demoFeedPosts: DemoFeedPost[] = [
  {
    id: "post-1",
    provider: "Nomvula Plumbing Co.",
    category: "Emergency plumbing",
    headline: "From panic call to hot water in one visit",
    caption: "Same-day geyser swap with parts already in the van. Customers can watch trust signals, response time, and active repair updates before they book.",
    stats: { likes: "2.4K", comments: "182", reposts: "64" },
    accent: "from-cyan-400 via-sky-500 to-blue-700",
    location: "Sea Point",
    rating: 4.9,
    reviews: 231,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#ServeHub", "#Plumbing", "#CapeTown"],
    comments: [
      { id: "c1", author: "A. Daniels", handle: "@adaniels", text: "This is exactly how local services should feel online." },
      { id: "c2", author: "N. Moyo", handle: "@nmoyo", text: "The before-and-after shots make this so easy to trust." },
    ],
    moments: ["Arrival in 12 min", "Live quote approved", "Warranty included"],
  },
  {
    id: "post-2",
    provider: "Lindiwe Clean Studio",
    category: "Deep cleaning",
    headline: "Move-out clean, staged like a content drop",
    caption: "A social-first service feed lets providers show process, polish, and proof. Every swipe pushes toward booking, not just browsing.",
    stats: { likes: "1.8K", comments: "143", reposts: "51" },
    accent: "from-amber-300 via-orange-400 to-rose-600",
    location: "De Waterkant",
    rating: 5,
    reviews: 187,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#DeepClean", "#HomeReset", "#ServeHub"],
    comments: [
      { id: "c3", author: "T. Jacobs", handle: "@tjacobs", text: "The social proof and booking link in one flow is strong." },
      { id: "c4", author: "M. Khumalo", handle: "@mkhumalo", text: "I would book from this page instantly." },
    ],
    moments: ["Before / after", "5-star crew", "Tomorrow slots open"],
  },
  {
    id: "post-3",
    provider: "Jason Electrical",
    category: "Electrical diagnostics",
    headline: "Real diagnostics, real ETA, real trust",
    caption: "Instead of static listings, providers show their process in motion. Customers swipe, save, comment, and book without leaving the feed.",
    stats: { likes: "1.2K", comments: "98", reposts: "39" },
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    location: "Gardens",
    rating: 4.8,
    reviews: 164,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#Electrical", "#RepairTok", "#ServeHub"],
    comments: [
      { id: "c5", author: "R. Ndlovu", handle: "@rndlovu", text: "This feels way more modern than a directory listing." },
      { id: "c6", author: "J. Smith", handle: "@jsmith", text: "Would love this for urgent callouts." },
    ],
    moments: ["18 min away", "Verified parts", "Instant chat"],
  },
];

export const demoProviders: DemoProvider[] = demoFeedPosts.map((post) => ({
  id: post.id,
  name: post.provider,
  category: post.category,
  rating: post.rating,
  reviews: post.reviews,
  neighborhood: post.location,
  verified: true,
  caption: post.caption,
  avatarUrl: post.avatarUrl,
}));

export const profileStats = [
  { id: "profile-stat-1", label: "Jobs booked", value: "18" },
  { id: "profile-stat-2", label: "Avg arrival", value: "19 min" },
  { id: "profile-stat-3", label: "Saved providers", value: "12" },
];

export const profileAddresses: DemoProfileSectionItem[] = [
  { id: "address-1", label: "Home", value: "14 Beach Road, Sea Point" },
  { id: "address-2", label: "Office", value: "97 Bree Street, Cape Town" },
];

export const profileSettings: DemoProfileSectionItem[] = [
  { id: "setting-1", label: "Push notifications", value: "Urgent jobs only" },
  { id: "setting-2", label: "Payment method", value: "Visa ending in 4242" },
  { id: "setting-3", label: "Support", value: "Priority customer tier" },
];

export const homeHighlights = [
  "Trusted providers near your address",
  "Book in minutes, chat in the same flow",
  "Live ETA and post-service proof built in",
];
