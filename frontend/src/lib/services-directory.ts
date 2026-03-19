// ─── Full service directory: 100 services across 11 categories ───

export interface ServiceCategory {
  id: string;
  name: string;
  emoji: string;
  icon: string; // lucide icon name
  color: string; // tailwind gradient
  services: ServiceItem[];
}

export interface ServiceItem {
  id: number;
  name: string;
  categoryId: string;
  popular?: boolean;
  imageUrl: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "home-repair",
    name: "Home Repair",
    emoji: "🔧",
    icon: "Wrench",
    color: "from-blue-500 to-cyan-400",
    services: [
      { id: 1, name: "Plumbing", categoryId: "home-repair", popular: true, imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
      { id: 2, name: "Emergency plumber", categoryId: "home-repair", popular: true, imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
      { id: 3, name: "Electrical repairs", categoryId: "home-repair", popular: true, imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80" },
      { id: 4, name: "Appliance repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80" },
      { id: 5, name: "Refrigerator repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=400&q=80" },
      { id: 6, name: "Washing machine repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80" },
      { id: 7, name: "Dishwasher repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=400&q=80" },
      { id: 8, name: "Air conditioner repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=400&q=80" },
      { id: 9, name: "Air conditioner installation", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1631545806609-45e8497ae91f?auto=format&fit=crop&w=400&q=80" },
      { id: 10, name: "Geyser repair", categoryId: "home-repair", popular: true, imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80" },
      { id: 11, name: "Geyser installation", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80" },
      { id: 12, name: "Locksmith", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 13, name: "Emergency locksmith", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80" },
      { id: 14, name: "Glass repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=400&q=80" },
      { id: 15, name: "Window installation", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?auto=format&fit=crop&w=400&q=80" },
      { id: 16, name: "Door installation", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 17, name: "Carpentry", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80" },
      { id: 18, name: "Furniture assembly", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80" },
      { id: 19, name: "Furniture repair", categoryId: "home-repair", imageUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80" },
      { id: 20, name: "Handyman services", categoryId: "home-repair", popular: true, imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    emoji: "🧹",
    icon: "SprayCan",
    color: "from-emerald-500 to-teal-400",
    services: [
      { id: 21, name: "House cleaning", categoryId: "cleaning", popular: true, imageUrl: "https://images.unsplash.com/photo-1581578731548-2364de5c7b07?auto=format&fit=crop&w=400&q=80" },
      { id: 22, name: "Deep cleaning", categoryId: "cleaning", popular: true, imageUrl: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=400&q=80" },
      { id: 23, name: "Carpet cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=400&q=80" },
      { id: 24, name: "Mattress cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80" },
      { id: 25, name: "Couch cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80" },
      { id: 26, name: "Window cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?auto=format&fit=crop&w=400&q=80" },
      { id: 27, name: "Office cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      { id: 28, name: "Post-construction cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 29, name: "Garden cleaning", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80" },
      { id: 30, name: "Waste removal", categoryId: "cleaning", imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "outdoor",
    name: "Outdoor & Garden",
    emoji: "🌿",
    icon: "TreePine",
    color: "from-green-500 to-emerald-400",
    services: [
      { id: 31, name: "Lawn mowing", categoryId: "outdoor", popular: true, imageUrl: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=400&q=80" },
      { id: 32, name: "Garden maintenance", categoryId: "outdoor", popular: true, imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80" },
      { id: 33, name: "Landscaping", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80" },
      { id: 34, name: "Tree cutting", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80" },
      { id: 35, name: "Tree trimming", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80" },
      { id: 36, name: "Irrigation system repair", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80" },
      { id: 37, name: "Borehole maintenance", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80" },
      { id: 38, name: "Pool cleaning", categoryId: "outdoor", popular: true, imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80" },
      { id: 39, name: "Pool repair", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80" },
      { id: 40, name: "Pest control", categoryId: "outdoor", imageUrl: "https://images.unsplash.com/photo-1632935190508-1c3e4e5e1024?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "vehicle",
    name: "Vehicle Services",
    emoji: "🚗",
    icon: "Car",
    color: "from-orange-500 to-amber-400",
    services: [
      { id: 41, name: "Mobile mechanic", categoryId: "vehicle", popular: true, imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80" },
      { id: 42, name: "Car diagnostic", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80" },
      { id: 43, name: "Car battery replacement", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?auto=format&fit=crop&w=400&q=80" },
      { id: 44, name: "Mobile car wash", categoryId: "vehicle", popular: true, imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80" },
      { id: 45, name: "Mobile car detailing", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=400&q=80" },
      { id: 46, name: "Tyre replacement", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 47, name: "Tyre repair", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 48, name: "Vehicle towing", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&w=400&q=80" },
      { id: 49, name: "Fuel delivery", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=400&q=80" },
      { id: 50, name: "Car locksmith", categoryId: "vehicle", imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "construction",
    name: "Construction",
    emoji: "🧑‍🔧",
    icon: "HardHat",
    color: "from-yellow-500 to-orange-400",
    services: [
      { id: 51, name: "Painting", categoryId: "construction", popular: true, imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80" },
      { id: 52, name: "Interior painting", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80" },
      { id: 53, name: "Exterior painting", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80" },
      { id: 54, name: "Tiling installation", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" },
      { id: 55, name: "Floor installation", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" },
      { id: 56, name: "Ceiling installation", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 57, name: "Drywall installation", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 58, name: "Roofing repair", categoryId: "construction", popular: true, imageUrl: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=400&q=80" },
      { id: 59, name: "Waterproofing", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 60, name: "Building contractor", categoryId: "construction", imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "tech",
    name: "Tech & Digital",
    emoji: "🧑‍💻",
    icon: "Laptop",
    color: "from-violet-500 to-purple-400",
    services: [
      { id: 61, name: "WiFi installation", categoryId: "tech", popular: true, imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80" },
      { id: 62, name: "Router setup", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80" },
      { id: 63, name: "CCTV installation", categoryId: "tech", popular: true, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80" },
      { id: 64, name: "Alarm system installation", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80" },
      { id: 65, name: "Smart home setup", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80" },
      { id: 66, name: "Computer repair", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80" },
      { id: 67, name: "Laptop repair", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80" },
      { id: 68, name: "Printer repair", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80" },
      { id: 69, name: "Data recovery", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80" },
      { id: 70, name: "IT support", categoryId: "tech", imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "personal",
    name: "Personal & Lifestyle",
    emoji: "💇",
    icon: "Scissors",
    color: "from-pink-500 to-rose-400",
    services: [
      { id: 71, name: "Barber (mobile haircut)", categoryId: "personal", popular: true, imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" },
      { id: 72, name: "Hair stylist", categoryId: "personal", popular: true, imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
      { id: 73, name: "Makeup artist", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=80" },
      { id: 74, name: "Nail technician", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
      { id: 75, name: "Massage therapist", categoryId: "personal", popular: true, imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80" },
      { id: 76, name: "Personal trainer", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80" },
      { id: 77, name: "Yoga instructor", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80" },
      { id: 78, name: "Dietitian consultation", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" },
      { id: 79, name: "Tattoo artist", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1590246814883-57c511e76a2b?auto=format&fit=crop&w=400&q=80" },
      { id: 80, name: "Photographer", categoryId: "personal", imageUrl: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "pet",
    name: "Pet Services",
    emoji: "🐶",
    icon: "PawPrint",
    color: "from-amber-500 to-yellow-400",
    services: [
      { id: 81, name: "Pet grooming", categoryId: "pet", popular: true, imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80" },
      { id: 82, name: "Dog walking", categoryId: "pet", popular: true, imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=400&q=80" },
      { id: 83, name: "Pet sitting", categoryId: "pet", imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80" },
      { id: 84, name: "Mobile vet", categoryId: "pet", imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80" },
      { id: 85, name: "Pet training", categoryId: "pet", imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "moving",
    name: "Moving & Delivery",
    emoji: "📦",
    icon: "Truck",
    color: "from-sky-500 to-blue-400",
    services: [
      { id: 86, name: "Moving services", categoryId: "moving", popular: true, imageUrl: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=400&q=80" },
      { id: 87, name: "Furniture moving", categoryId: "moving", imageUrl: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=400&q=80" },
      { id: 88, name: "Small parcel delivery", categoryId: "moving", imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80" },
      { id: 89, name: "Courier service", categoryId: "moving", popular: true, imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80" },
      { id: 90, name: "Grocery delivery", categoryId: "moving", imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "business",
    name: "Business & Professional",
    emoji: "🏢",
    icon: "Briefcase",
    color: "from-slate-500 to-zinc-400",
    services: [
      { id: 91, name: "Accountant", categoryId: "business", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80" },
      { id: 92, name: "Tax consultant", categoryId: "business", imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80" },
      { id: 93, name: "Legal consultation", categoryId: "business", imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
      { id: 94, name: "Business consultant", categoryId: "business", imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80" },
      { id: 95, name: "Marketing consultant", categoryId: "business", imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "emergency",
    name: "Emergency",
    emoji: "⚡",
    icon: "Zap",
    color: "from-red-500 to-rose-400",
    services: [
      { id: 96, name: "Emergency electrician", categoryId: "emergency", popular: true, imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80" },
      { id: 97, name: "Emergency plumber", categoryId: "emergency", popular: true, imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
      { id: 98, name: "Emergency locksmith", categoryId: "emergency", imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80" },
      { id: 99, name: "Roadside assistance", categoryId: "emergency", popular: true, imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&w=400&q=80" },
      { id: 100, name: "Emergency generator repair", categoryId: "emergency", imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=400&q=80" },
    ],
  },
];

export const ALL_SERVICES: ServiceItem[] = SERVICE_CATEGORIES.flatMap((cat) => cat.services);

export const POPULAR_SERVICES: ServiceItem[] = ALL_SERVICES.filter((s) => s.popular);

export function getCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find((c) => c.id === id);
}

export function getServicesByCategory(categoryId: string): ServiceItem[] {
  return getCategoryById(categoryId)?.services ?? [];
}
