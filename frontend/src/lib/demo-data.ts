export interface DemoHomeService {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  eta: string;
  duration: string;
  price: string;
  accent: string;
  badge: string;
  provider: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  tags: string[];
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
  status: "REQUESTED" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED";
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

export interface DemoAddressBookItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface DemoPaymentMethod {
  id: string;
  brand: string;
  last4: string;
  holder: string;
  expiry: string;
  default?: boolean;
}

export interface DemoProfile {
  fullName: string;
  email: string;
  phone: string;
}

export const homeServices: DemoHomeService[] = [
  {
    id: "service-1",
    title: "Emergency plumbing",
    subtitle: "Leaks, geysers, blockages",
    description: "Same-day plumbers for burst pipes, blocked drains, and hot water callouts with fast arrival updates.",
    category: "Plumbing",
    eta: "12 min",
    duration: "1.5 hrs",
    price: "From R420",
    accent: "from-cyan-300 via-sky-400 to-blue-700",
    badge: "Most booked",
    provider: "Nomvula Plumbing Co.",
    rating: 4.9,
    reviews: 231,
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1200&q=80",
    tags: ["Urgent", "Verified", "Warranty"],
  },
  {
    id: "service-2",
    title: "Deep cleaning",
    subtitle: "Same-day home refresh",
    description: "Move-out cleans, recurring home resets, and post-renovation refreshes with live crew messaging.",
    category: "Cleaning",
    eta: "22 min",
    duration: "3 hrs",
    price: "From R360",
    accent: "from-amber-200 via-orange-400 to-rose-600",
    badge: "Top rated",
    provider: "Lindiwe Clean Studio",
    rating: 5,
    reviews: 187,
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    tags: ["Eco", "Crew", "Same-day"],
  },
  {
    id: "service-3",
    title: "Electrical fixes",
    subtitle: "Diagnostics and repair",
    description: "Troubleshooting for plugs, DB boards, lights, and kitchen appliances with instant ETA tracking.",
    category: "Electrical",
    eta: "18 min",
    duration: "1 hr",
    price: "From R390",
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    badge: "Fast arrival",
    provider: "Jason Electrical",
    rating: 4.8,
    reviews: 164,
    imageUrl: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=1200&q=80",
    tags: ["Certified", "Trusted", "Repair"],
  },
  {
    id: "service-4",
    title: "Garden care",
    subtitle: "Weekly and urgent jobs",
    description: "Lawn cuts, hedge shaping, green waste removal, and recurring maintenance for homes and rentals.",
    category: "Gardening",
    eta: "35 min",
    duration: "2 hrs",
    price: "From R340",
    accent: "from-lime-300 via-emerald-400 to-teal-700",
    badge: "Weekend special",
    provider: "Coastline Garden Crew",
    rating: 4.7,
    reviews: 118,
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=1200&q=80",
    tags: ["Recurring", "Yard waste", "Weekend"],
  },
  {
    id: "service-5",
    title: "Hair styling",
    subtitle: "Braids, cuts, silk press",
    description: "Book at-home hair appointments for braids, styling, trims, and event prep with preferred time slots.",
    category: "Hair",
    eta: "28 min",
    duration: "2 hrs",
    price: "From R280",
    accent: "from-fuchsia-300 via-pink-500 to-rose-700",
    badge: "Beauty favorite",
    provider: "Nia Hair Studio",
    rating: 4.9,
    reviews: 201,
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    tags: ["Home visit", "Braids", "Events"],
  },
  {
    id: "service-6",
    title: "Dog washing",
    subtitle: "Mobile grooming at home",
    description: "Quick wash, dry, and brush-out sessions for dogs with pet-safe products and friendly handlers.",
    category: "Dog Washing",
    eta: "24 min",
    duration: "45 min",
    price: "From R220",
    accent: "from-orange-200 via-amber-400 to-yellow-600",
    badge: "Pet care",
    provider: "Paws & Bubbles",
    rating: 4.8,
    reviews: 142,
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
    tags: ["Pet-safe", "Mobile", "Gentle"],
  },
  {
    id: "service-7",
    title: "Pool cleaning",
    subtitle: "Vacuum, skim, chemical check",
    description: "Reliable pool visits for vacuuming, chemical balancing, and filter checks before the weekend.",
    category: "Pool Cleaning",
    eta: "31 min",
    duration: "1 hr",
    price: "From R480",
    accent: "from-sky-300 via-cyan-500 to-teal-700",
    badge: "Summer ready",
    provider: "Bluewater Pros",
    rating: 4.8,
    reviews: 94,
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    tags: ["Water balance", "Weekly", "Trusted"],
  },
  {
    id: "service-8",
    title: "Dog walking",
    subtitle: "Daily, lunchtime, and evening",
    description: "Flexible dog walks with route tracking, pictures, and recurring scheduling for busy owners.",
    category: "Dog Walking",
    eta: "16 min",
    duration: "30 min",
    price: "From R160",
    accent: "from-emerald-300 via-lime-400 to-green-700",
    badge: "Near you",
    provider: "Happy Tails Walkers",
    rating: 4.8,
    reviews: 132,
    imageUrl: "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=1200&q=80",
    tags: ["Recurring", "Photos", "Tracked"],
  },
  {
    id: "service-9",
    title: "Makeup artist",
    subtitle: "Soft glam, events, bridal",
    description: "In-home glam, bridal looks, and photoshoot makeup with booking notes for inspiration and skin tone matching.",
    category: "Makeup",
    eta: "42 min",
    duration: "75 min",
    price: "From R520",
    accent: "from-rose-200 via-pink-400 to-fuchsia-700",
    badge: "Booked this week",
    provider: "Lebo Beauty",
    rating: 5,
    reviews: 156,
    imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=1200&q=80",
    tags: ["Bridal", "Soft glam", "Premium"],
  },
  {
    id: "service-10",
    title: "Nail technician",
    subtitle: "Gel, acrylic, and nail art",
    description: "Salon-quality nails at home with gel, overlays, acrylics, and custom art options for appointments.",
    category: "Nails",
    eta: "26 min",
    duration: "1.5 hrs",
    price: "From R260",
    accent: "from-violet-300 via-purple-500 to-pink-700",
    badge: "Salon at home",
    provider: "Gloss Lab Nails",
    rating: 4.8,
    reviews: 116,
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80",
    tags: ["Gel", "Art", "Home service"],
  },
  {
    id: "service-11",
    title: "Car wash",
    subtitle: "Interior and exterior detail",
    description: "On-demand car wash and detailing at your home or office with add-ons for interior refresh and wax.",
    category: "Car Wash",
    eta: "19 min",
    duration: "1 hr",
    price: "From R240",
    accent: "from-slate-200 via-sky-400 to-blue-700",
    badge: "Express",
    provider: "CityShine Detail",
    rating: 4.7,
    reviews: 145,
    imageUrl: "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?auto=format&fit=crop&w=1200&q=80",
    tags: ["Office", "Wax add-on", "Waterless"],
  },
  {
    id: "service-12",
    title: "Massage therapy",
    subtitle: "Sports, recovery, in-home",
    description: "Recovery, deep tissue, and wellness sessions in your space with quick profile and preference setup.",
    category: "Massage",
    eta: "37 min",
    duration: "60 min",
    price: "From R450",
    accent: "from-stone-200 via-amber-300 to-orange-500",
    badge: "Wellness",
    provider: "Calm Room Therapy",
    rating: 4.9,
    reviews: 111,
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    tags: ["Recovery", "Wellness", "In-home"],
  },
  {
    id: "service-13",
    title: "Appliance repair",
    subtitle: "Fridges, washers, ovens",
    description: "Book diagnostics and repairs for common home appliances with live arrival and quote updates.",
    category: "Appliances",
    eta: "27 min",
    duration: "1 hr",
    price: "From R430",
    accent: "from-blue-200 via-indigo-400 to-violet-700",
    badge: "Household essential",
    provider: "FixRight Appliances",
    rating: 4.7,
    reviews: 136,
    imageUrl: "https://images.unsplash.com/photo-1581578021517-5d0d6f0c4a7f?auto=format&fit=crop&w=1200&q=80",
    tags: ["Diagnostics", "Warranty", "Repair"],
  },
  {
    id: "service-14",
    title: "Moving help",
    subtitle: "Loaders, van, same-day help",
    description: "Short-distance moves, heavy lifting, and apartment relocations with message coordination built in.",
    category: "Moving",
    eta: "33 min",
    duration: "3 hrs",
    price: "From R790",
    accent: "from-indigo-200 via-blue-400 to-slate-700",
    badge: "Weekend mover",
    provider: "Swift Move Crew",
    rating: 4.6,
    reviews: 103,
    imageUrl: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=1200&q=80",
    tags: ["Vans", "Heavy items", "Team"],
  },
  {
    id: "service-15",
    title: "Painter for touch-ups",
    subtitle: "Walls, trims, patching",
    description: "Patch, prime, and paint rooms or rental touch-ups with clear pricing and photo-ready finish work.",
    category: "Painting",
    eta: "41 min",
    duration: "4 hrs",
    price: "From R560",
    accent: "from-pink-200 via-rose-400 to-orange-600",
    badge: "Rental ready",
    provider: "Fresh Coat Co.",
    rating: 4.8,
    reviews: 126,
    imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80",
    tags: ["Touch-ups", "Fast prep", "Rental"],
  },
  {
    id: "service-16",
    title: "HVAC servicing",
    subtitle: "Cooling, filters, diagnostics",
    description: "Routine HVAC maintenance and urgent cooling repairs with verified technicians and message updates.",
    category: "HVAC",
    eta: "29 min",
    duration: "90 min",
    price: "From R610",
    accent: "from-cyan-200 via-sky-400 to-indigo-700",
    badge: "Heatwave ready",
    provider: "CoolFlow HVAC",
    rating: 4.8,
    reviews: 149,
    imageUrl: "https://images.unsplash.com/photo-1631545806522-6b84f1ec18fb?auto=format&fit=crop&w=1200&q=80",
    tags: ["Cooling", "Maintenance", "Emergency"],
  },
  {
    id: "service-17",
    title: "Security install",
    subtitle: "Cameras, sensors, alarms",
    description: "Home security setups and upgrades with camera placement, alerts, and on-site assessment.",
    category: "Security",
    eta: "46 min",
    duration: "2 hrs",
    price: "From R980",
    accent: "from-slate-300 via-gray-500 to-slate-800",
    badge: "Home safety",
    provider: "SafeNest Tech",
    rating: 4.8,
    reviews: 88,
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    tags: ["CCTV", "Alarm", "Assessment"],
  },
  {
    id: "service-18",
    title: "Carpentry fixes",
    subtitle: "Shelves, doors, custom fittings",
    description: "Quick carpentry support for doors, cupboards, shelving, and finish work with photo notes.",
    category: "Carpentry",
    eta: "39 min",
    duration: "2 hrs",
    price: "From R520",
    accent: "from-amber-200 via-yellow-500 to-orange-700",
    badge: "Custom fit",
    provider: "Oak & Hammer",
    rating: 4.7,
    reviews: 97,
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1200&q=80",
    tags: ["Shelving", "Repairs", "Woodwork"],
  },
];

export const orderHistory: DemoOrderHistory[] = [
  { id: "history-1", title: "Carpet refresh", provider: "Lindiwe Clean Studio", date: "Tue 4 Mar", price: "R520" },
  { id: "history-2", title: "Ceiling fan install", provider: "Jason Electrical", date: "Fri 28 Feb", price: "R780" },
  { id: "history-3", title: "Patio pressure wash", provider: "Coastline Wash", date: "Sun 16 Feb", price: "R690" },
  { id: "history-4", title: "Dog wash", provider: "Paws & Bubbles", date: "Mon 10 Feb", price: "R220" },
];

export const demoBookings: DemoBooking[] = [
  {
    id: "booking-1",
    service: "Emergency plumbing",
    provider: "Nomvula Plumbing Co.",
    providerRole: "Emergency plumbing",
    status: "IN_PROGRESS",
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
    status: "ACCEPTED",
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
    status: "REQUESTED",
    eta: "Awaiting acceptance",
    scheduledFor: "Today, 13:45",
    price: "R680",
    address: "92 Kloof Street, Gardens",
    progress: 22,
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    imageUrl: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    checklist: [
      { label: "Request submitted", complete: true },
      { label: "Provider accepted", complete: false },
      { label: "Diagnostics underway", complete: false },
      { label: "Repair complete", complete: false },
    ],
    thread: [
      { id: "t6", sender: "Jason", text: "I have seen the request and will confirm within 10 minutes.", time: "11:58" },
    ],
  },
  {
    id: "booking-4",
    service: "Dog washing",
    provider: "Paws & Bubbles",
    providerRole: "Mobile pet care",
    status: "COMPLETED",
    eta: "Finished",
    scheduledFor: "Sun, 09:00",
    price: "R220",
    address: "97 Bree Street, Cape Town",
    progress: 100,
    accent: "from-orange-200 via-amber-400 to-yellow-600",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
    checklist: [
      { label: "Request submitted", complete: true },
      { label: "Provider accepted", complete: true },
      { label: "Service completed", complete: true },
      { label: "Feedback shared", complete: true },
    ],
    thread: [
      { id: "t7", sender: "Mika", text: "Milo was great. I uploaded two fresh after-care photos to the job.", time: "Yesterday" },
    ],
  },
];

export const demoFeedPosts: DemoFeedPost[] = [
  {
    id: "post-1",
    provider: "Nomvula Plumbing Co.",
    category: "Plumbing",
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
    category: "Cleaning",
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
    provider: "Nia Hair Studio",
    category: "Hair",
    headline: "A beauty booking should feel this effortless",
    caption: "Search, save inspiration, book a time slot, and message the stylist from one mobile flow instead of scattered DMs.",
    stats: { likes: "1.6K", comments: "127", reposts: "44" },
    accent: "from-fuchsia-300 via-pink-500 to-rose-700",
    location: "Green Point",
    rating: 4.9,
    reviews: 201,
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#Hair", "#BeautyBooking", "#ServeHub"],
    comments: [
      { id: "c5", author: "S. Peters", handle: "@speters", text: "This is much cleaner than messaging on socials." },
      { id: "c6", author: "K. Ncube", handle: "@kncube", text: "Love that the price and ETA are visible upfront." },
    ],
    moments: ["Available today", "Style preview", "Message first"],
  },
  {
    id: "post-4",
    provider: "Bluewater Pros",
    category: "Pool Cleaning",
    headline: "Pool reset content that sells the booking instantly",
    caption: "Clear before-and-after proof, chemical balancing, and a visible arrival window make this feel closer to TikTok than a dusty directory listing.",
    stats: { likes: "1.3K", comments: "96", reposts: "33" },
    accent: "from-sky-300 via-cyan-500 to-teal-700",
    location: "Camps Bay",
    rating: 4.8,
    reviews: 94,
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#PoolCare", "#BeforeAfter", "#ServeHub"],
    comments: [
      { id: "c7", author: "R. Naidoo", handle: "@rnaidoo", text: "This makes weekend prep feel one tap away." },
      { id: "c8", author: "L. Adams", handle: "@ladams", text: "The visual proof is what finally makes service discovery click." },
    ],
    moments: ["Saturday slots", "Balanced chemicals", "Filter check done"],
  },
  {
    id: "post-5",
    provider: "Lebo Beauty",
    category: "Makeup",
    headline: "Soft glam, bridal, and event prep in one swipe",
    caption: "Customers can move from inspiration to booking without asking for prices in DMs or waiting for manual confirmation.",
    stats: { likes: "2.1K", comments: "174", reposts: "59" },
    accent: "from-rose-200 via-pink-400 to-fuchsia-700",
    location: "City Bowl",
    rating: 5,
    reviews: 156,
    avatarUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#SoftGlam", "#BridalPrep", "#ServeHub"],
    comments: [
      { id: "c9", author: "P. Dube", handle: "@pdube", text: "This feels exactly like how beauty services should convert." },
      { id: "c10", author: "J. Khan", handle: "@jkhan", text: "The live slots and pricing make a huge difference." },
    ],
    moments: ["Event-ready", "Skin-tone matched", "Travel fee included"],
  },
  {
    id: "post-6",
    provider: "Paws & Bubbles",
    category: "Dog Washing",
    headline: "A pet-care feed that feels playful and bookable",
    caption: "Mobile grooming, wash-and-dry sessions, and live photo updates turn routine pet care into something customers actually want to tap through.",
    stats: { likes: "1.1K", comments: "88", reposts: "27" },
    accent: "from-orange-200 via-amber-400 to-yellow-600",
    location: "Bantry Bay",
    rating: 4.8,
    reviews: 142,
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#PetCare", "#MobileGrooming", "#ServeHub"],
    comments: [
      { id: "c11", author: "M. Smith", handle: "@msmith", text: "Pet parents are going to love this." },
      { id: "c12", author: "C. Maseko", handle: "@cmaseko", text: "The after-care notes inside the booking flow are smart." },
    ],
    moments: ["Gentle products", "Photo updates", "Recurring slots"],
  },
  {
    id: "post-7",
    provider: "CityShine Detail",
    category: "Car Wash",
    headline: "Your driveway becomes the detailing bay",
    caption: "Quick-scroll proof of the finish, time estimate, and service add-ons makes the whole booking flow feel native to mobile content habits.",
    stats: { likes: "980", comments: "71", reposts: "21" },
    accent: "from-slate-200 via-sky-400 to-blue-700",
    location: "Woodstock",
    rating: 4.7,
    reviews: 145,
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1607861716497-e65ab29fc7ac?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#CarDetailing", "#DrivewayService", "#ServeHub"],
    comments: [
      { id: "c13", author: "H. Daniels", handle: "@hdaniels", text: "This would absolutely convert office workers." },
      { id: "c14", author: "E. Jacobs", handle: "@ejacobs", text: "Seeing the exact finish level in-feed is a win." },
    ],
    moments: ["Office parking", "Interior add-on", "45 min turnaround"],
  },
  {
    id: "post-8",
    provider: "Calm Room Therapy",
    category: "Massage",
    headline: "Wellness booking without the clunky checkout feeling",
    caption: "The content-first layout lets customers browse therapist style, see availability, and message preferences before they ever leave the app shell.",
    stats: { likes: "1.5K", comments: "112", reposts: "38" },
    accent: "from-stone-200 via-amber-300 to-orange-500",
    location: "Oranjezicht",
    rating: 4.9,
    reviews: 111,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80",
    imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    hashtags: ["#Recovery", "#MassageAtHome", "#ServeHub"],
    comments: [
      { id: "c15", author: "S. Pillay", handle: "@spillay", text: "This is the first at-home wellness flow that looks premium." },
      { id: "c16", author: "A. Mokoena", handle: "@amokoena", text: "Would book straight from the Explore tab." },
    ],
    moments: ["Tonight slots", "Pressure preferences", "Recovery focus"],
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

export const demoUserProfile: DemoProfile = {
  fullName: "Alex Thompson",
  email: "alex@servehub.app",
  phone: "+27 72 555 0192",
};

export const demoAddressBook: DemoAddressBookItem[] = [
  { id: "address-1", label: "Home", value: "14 Beach Road, Sea Point", note: "Ring intercom 14, blue gate." },
  { id: "address-2", label: "Office", value: "97 Bree Street, Cape Town", note: "Reception closes at 18:00." },
  { id: "address-3", label: "Mom", value: "40 Main Road, Green Point", note: "Back driveway is easiest for parking." },
  { id: "address-4", label: "Weekend", value: "17 Victoria Road, Camps Bay", note: "Buzz unit 5 at the gate." },
];

export const demoPaymentMethods: DemoPaymentMethod[] = [
  { id: "pm-1", brand: "Visa", last4: "4242", holder: "Alex Thompson", expiry: "10/28", default: true },
  { id: "pm-2", brand: "Mastercard", last4: "5521", holder: "Alex Thompson", expiry: "07/27" },
];

export const profileStats = [
  { id: "profile-stat-1", label: "Jobs booked", value: "18" },
  { id: "profile-stat-2", label: "Avg arrival", value: "19 min" },
  { id: "profile-stat-3", label: "Saved providers", value: "12" },
];

export const profileAddresses: DemoProfileSectionItem[] = demoAddressBook.map((address) => ({
  id: address.id,
  label: address.label,
  value: address.value,
}));

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
