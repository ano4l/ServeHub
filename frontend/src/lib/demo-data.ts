export interface DemoProvider {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  eta: string;
  caption: string;
  accent: string;
  neighborhood: string;
  likes: string;
  verified: boolean;
  price: string;
}

export interface DemoMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
}

export interface DemoOpsItem {
  label: string;
  value: string;
  detail: string;
  tone: string;
}

export const demoProviders: DemoProvider[] = [
  {
    id: "provider-1",
    name: "Nomvula Plumbing Co.",
    category: "Emergency plumbing",
    rating: 4.9,
    reviews: 231,
    eta: "12 min",
    caption: "Burst geyser callout turned into a same-day install. Customers can watch the job progress before booking.",
    accent: "from-cyan-400 via-sky-500 to-blue-700",
    neighborhood: "Green Point",
    likes: "2.4K",
    verified: true,
    price: "from R450",
  },
  {
    id: "provider-2",
    name: "Lindiwe Clean Studio",
    category: "Deep cleaning",
    rating: 5.0,
    reviews: 187,
    eta: "22 min",
    caption: "Before-and-after content, fast arrival windows, and trust signals all in one mobile flow.",
    accent: "from-amber-300 via-orange-400 to-rose-600",
    neighborhood: "Sea Point",
    likes: "1.8K",
    verified: true,
    price: "from R320",
  },
  {
    id: "provider-3",
    name: "Jason Electrical",
    category: "Electrical diagnostics",
    rating: 4.8,
    reviews: 164,
    eta: "18 min",
    caption: "The feed helps providers look like real businesses instead of anonymous listings.",
    accent: "from-emerald-300 via-teal-500 to-cyan-700",
    neighborhood: "Gardens",
    likes: "1.2K",
    verified: true,
    price: "from R380",
  },
];

export const demoMessages: DemoMessage[] = [
  { id: "m1", sender: "Nomvula", text: "I can be there in 12 minutes. Please share a gate code if needed.", time: "09:14" },
  { id: "m2", sender: "You", text: "Gate code is 1946. Please check the geyser pressure valve too.", time: "09:16" },
  { id: "m3", sender: "Nomvula", text: "Perfect. I have the replacement parts in the van already.", time: "09:17" },
];

export const demoQuickReplies = [
  "Please ring on arrival",
  "Can you share a revised quote?",
  "I also need help with another room",
];

export const demoOpsItems: DemoOpsItem[] = [
  { label: "GMV this month", value: "R1.24M", detail: "+18% vs last month", tone: "text-emerald-700 bg-emerald-100" },
  { label: "Verified providers", value: "842", detail: "64 added this week", tone: "text-sky-700 bg-sky-100" },
  { label: "Median arrival time", value: "19 min", detail: "Down from 24 min", tone: "text-amber-700 bg-amber-100" },
];
