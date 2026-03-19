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
  description: string;
  priceRange: string;
  duration: string;
  rating: number;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "home-repair",
    name: "Home Repair",
    emoji: "🔧",
    icon: "Wrench",
    color: "from-blue-500 to-cyan-400",
    services: [
      { id: 1, name: "Plumbing", categoryId: "home-repair", popular: true, description: "Fix leaks, burst pipes, blocked drains, and install new plumbing fixtures professionally.", priceRange: "R350–R1 200", duration: "1–3 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80" },
      { id: 2, name: "Emergency plumber", categoryId: "home-repair", popular: true, description: "24/7 emergency plumbing for burst geysers, sewage backups, and flooding.", priceRange: "R600–R2 500", duration: "30 min–2 hrs", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
      { id: 3, name: "Electrical repairs", categoryId: "home-repair", popular: true, description: "Wiring repairs, circuit breaker fixes, outlet replacements, and electrical safety inspections.", priceRange: "R400–R1 500", duration: "1–4 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80" },
      { id: 4, name: "Appliance repair", categoryId: "home-repair", description: "Repair stoves, ovens, microwaves and other household appliances on-site.", priceRange: "R300–R1 000", duration: "1–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=400&q=80" },
      { id: 5, name: "Refrigerator repair", categoryId: "home-repair", description: "Fix cooling issues, compressor problems, ice maker faults and thermostat failures.", priceRange: "R400–R1 200", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?auto=format&fit=crop&w=400&q=80" },
      { id: 6, name: "Washing machine repair", categoryId: "home-repair", description: "Resolve spin cycle issues, drainage problems, leaks and electronic board faults.", priceRange: "R350–R1 000", duration: "1–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=400&q=80" },
      { id: 7, name: "Dishwasher repair", categoryId: "home-repair", description: "Fix drainage, heating, spray arm and detergent dispenser issues.", priceRange: "R350–R900", duration: "1–2 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=400&q=80" },
      { id: 8, name: "Air conditioner repair", categoryId: "home-repair", description: "Diagnose and fix AC gas leaks, compressor faults, and thermostat issues.", priceRange: "R500–R2 000", duration: "1–3 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1631545806609-45e8497ae91f?auto=format&fit=crop&w=400&q=80" },
      { id: 9, name: "Air conditioner installation", categoryId: "home-repair", description: "Professional split-unit and window AC installation with warranty.", priceRange: "R1 500–R4 000", duration: "2–4 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?auto=format&fit=crop&w=400&q=80" },
      { id: 10, name: "Geyser repair", categoryId: "home-repair", popular: true, description: "Thermostat replacement, element repair, and pressure valve fixes for electric and solar geysers.", priceRange: "R500–R2 500", duration: "1–3 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80" },
      { id: 11, name: "Geyser installation", categoryId: "home-repair", description: "Full geyser installation including compliance certificate and plumbing connections.", priceRange: "R3 000–R8 000", duration: "3–5 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=400&q=80" },
      { id: 12, name: "Locksmith", categoryId: "home-repair", description: "Lock changes, key cutting, safe opening, and security lock upgrades.", priceRange: "R250–R800", duration: "30 min–1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 13, name: "Emergency locksmith", categoryId: "home-repair", description: "Locked out? 24/7 emergency lockout service for homes, offices, and cars.", priceRange: "R400–R1 200", duration: "20–45 min", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80" },
      { id: 14, name: "Glass repair", categoryId: "home-repair", description: "Broken window panes, glass door repairs, and safety glass replacements.", priceRange: "R300–R1 500", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=400&q=80" },
      { id: 15, name: "Window installation", categoryId: "home-repair", description: "Aluminium and wooden window frame installation with weatherproofing.", priceRange: "R1 200–R5 000", duration: "2–6 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?auto=format&fit=crop&w=400&q=80" },
      { id: 16, name: "Door installation", categoryId: "home-repair", description: "Interior and exterior door fitting, security gate installation, and frame adjustments.", priceRange: "R800–R3 500", duration: "2–4 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=400&q=80" },
      { id: 17, name: "Carpentry", categoryId: "home-repair", description: "Custom shelving, built-in cupboards, wooden repairs, and bespoke woodwork.", priceRange: "R500–R5 000", duration: "2–8 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80" },
      { id: 18, name: "Furniture assembly", categoryId: "home-repair", description: "Flatpack assembly for desks, wardrobes, beds, and shelving units.", priceRange: "R200–R600", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80" },
      { id: 19, name: "Furniture repair", categoryId: "home-repair", description: "Fix wobbly legs, broken joints, scratches, and reupholster cushions.", priceRange: "R300–R1 500", duration: "1–4 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80" },
      { id: 20, name: "Handyman services", categoryId: "home-repair", popular: true, description: "General fixes — hanging shelves, patching walls, fixing taps, odd jobs around the house.", priceRange: "R250–R800", duration: "1–4 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "cleaning",
    name: "Cleaning",
    emoji: "✨",
    icon: "Sparkles",
    color: "from-emerald-500 to-teal-400",
    services: [
      { id: 21, name: "House cleaning", categoryId: "cleaning", popular: true, description: "Full house clean including dusting, mopping, vacuuming, kitchen, and bathrooms.", priceRange: "R350–R800", duration: "3–5 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80" },
      { id: 22, name: "Deep cleaning", categoryId: "cleaning", popular: true, description: "Intensive scrubbing of every surface — oven, tiles, grout, window sills, skirting boards.", priceRange: "R600–R1 500", duration: "4–8 hrs", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=400&q=80" },
      { id: 23, name: "Carpet cleaning", categoryId: "cleaning", description: "Professional steam cleaning and stain removal for carpets and rugs.", priceRange: "R300–R900", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=400&q=80" },
      { id: 24, name: "Mattress cleaning", categoryId: "cleaning", description: "Deep sanitisation, dust mite removal, and stain treatment for mattresses.", priceRange: "R250–R500", duration: "1–2 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=400&q=80" },
      { id: 25, name: "Couch cleaning", categoryId: "cleaning", description: "Steam clean and deodorise fabric and leather sofas, remove tough stains.", priceRange: "R300–R700", duration: "1–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=400&q=80" },
      { id: 26, name: "Window cleaning", categoryId: "cleaning", description: "Interior and exterior window washing for homes and offices, streak-free finish.", priceRange: "R200–R600", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1604079628040-94301bb21b91?auto=format&fit=crop&w=400&q=80" },
      { id: 27, name: "Office cleaning", categoryId: "cleaning", description: "Regular or once-off office cleaning — desks, floors, kitchens, bathrooms.", priceRange: "R500–R2 000", duration: "2–5 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80" },
      { id: 28, name: "Post-construction cleaning", categoryId: "cleaning", description: "Remove dust, paint, cement residue and debris after building or renovation work.", priceRange: "R800–R3 000", duration: "4–8 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 29, name: "Garden cleaning", categoryId: "cleaning", description: "Clear garden debris, rake leaves, weed beds, and general yard tidying.", priceRange: "R250–R600", duration: "2–4 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80" },
      { id: 30, name: "Waste removal", categoryId: "cleaning", description: "Rubble, garden waste, old furniture and junk removal with responsible disposal.", priceRange: "R400–R1 500", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "outdoor",
    name: "Outdoor & Garden",
    emoji: "🌿",
    icon: "TreePine",
    color: "from-green-500 to-emerald-400",
    services: [
      { id: 31, name: "Lawn mowing", categoryId: "outdoor", popular: true, description: "Professional lawn mowing, edging, and grass clipping removal.", priceRange: "R150–R400", duration: "1–2 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=400&q=80" },
      { id: 32, name: "Garden maintenance", categoryId: "outdoor", popular: true, description: "Regular weeding, pruning, feeding, mulching, and seasonal planting.", priceRange: "R300–R800", duration: "2–4 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80" },
      { id: 33, name: "Landscaping", categoryId: "outdoor", description: "Full garden design, paving, retaining walls, irrigation, and planting.", priceRange: "R2 000–R15 000", duration: "1–5 days", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80" },
      { id: 34, name: "Tree cutting", categoryId: "outdoor", description: "Safe removal of large or dangerous trees, stump grinding included.", priceRange: "R800–R5 000", duration: "2–6 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80" },
      { id: 35, name: "Tree trimming", categoryId: "outdoor", description: "Shape and prune overgrown branches for safety and aesthetics.", priceRange: "R400–R2 000", duration: "1–4 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1501004318855-e73a3e1bd4fe?auto=format&fit=crop&w=400&q=80" },
      { id: 36, name: "Irrigation system repair", categoryId: "outdoor", description: "Fix sprinkler heads, solenoid valves, pipes, and controller programming.", priceRange: "R300–R1 200", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=400&q=80" },
      { id: 37, name: "Borehole maintenance", categoryId: "outdoor", description: "Pump servicing, water quality testing, and pressure system checks.", priceRange: "R500–R2 500", duration: "2–4 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=400&q=80" },
      { id: 38, name: "Pool cleaning", categoryId: "outdoor", popular: true, description: "Vacuum, skim, backwash, chemical balancing, and filter maintenance.", priceRange: "R250–R600", duration: "1–2 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=400&q=80" },
      { id: 39, name: "Pool repair", categoryId: "outdoor", description: "Fix pool pumps, filters, plaster cracks, and tile replacements.", priceRange: "R500–R3 000", duration: "2–6 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?auto=format&fit=crop&w=400&q=80" },
      { id: 40, name: "Pest control", categoryId: "outdoor", description: "Treat termites, cockroaches, rats, ants, and other pests safely.", priceRange: "R400–R1 500", duration: "1–3 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1632935190508-1c3e4e5e1024?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "vehicle",
    name: "Vehicle Services",
    emoji: "🚗",
    icon: "Car",
    color: "from-orange-500 to-amber-400",
    services: [
      { id: 41, name: "Mobile mechanic", categoryId: "vehicle", popular: true, description: "On-site engine diagnostics, brake service, oil changes, and general car repairs.", priceRange: "R500–R3 000", duration: "1–4 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=400&q=80" },
      { id: 42, name: "Car diagnostic", categoryId: "vehicle", description: "OBD scanner diagnostics to pinpoint engine warning lights and fault codes.", priceRange: "R250–R500", duration: "30 min–1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=400&q=80" },
      { id: 43, name: "Car battery replacement", categoryId: "vehicle", description: "Test, supply, and fit a new battery at your location with old battery disposal.", priceRange: "R800–R2 000", duration: "30 min–1 hr", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1620891549027-942fdc95d3f5?auto=format&fit=crop&w=400&q=80" },
      { id: 44, name: "Mobile car wash", categoryId: "vehicle", popular: true, description: "Exterior wash, interior vacuum, dashboard wipe, and tyre shine at your door.", priceRange: "R100–R350", duration: "30 min–1 hr", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=400&q=80" },
      { id: 45, name: "Mobile car detailing", categoryId: "vehicle", description: "Full interior and exterior detailing — clay bar, polish, wax, leather conditioning.", priceRange: "R600–R2 500", duration: "2–5 hrs", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&w=400&q=80" },
      { id: 46, name: "Tyre replacement", categoryId: "vehicle", description: "Mobile tyre fitting — supply and fit new tyres, wheel balancing included.", priceRange: "R500–R4 000", duration: "30 min–1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=400&q=80" },
      { id: 47, name: "Tyre repair", categoryId: "vehicle", description: "Puncture repair, slow leak fix, and sidewall inspection at your location.", priceRange: "R150–R400", duration: "20–40 min", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1613214150384-a69fd9e8ef59?auto=format&fit=crop&w=400&q=80" },
      { id: 48, name: "Vehicle towing", categoryId: "vehicle", description: "Flatbed towing for breakdowns, accidents, and non-runners to your chosen destination.", priceRange: "R800–R3 000", duration: "30 min–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&w=400&q=80" },
      { id: 49, name: "Fuel delivery", categoryId: "vehicle", description: "Run out of fuel? We deliver petrol or diesel to your exact GPS location.", priceRange: "R200–R500", duration: "20–45 min", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=400&q=80" },
      { id: 50, name: "Car locksmith", categoryId: "vehicle", description: "Locked keys in car? Transponder key programming and car lock opening.", priceRange: "R400–R1 200", duration: "20 min–1 hr", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "construction",
    name: "Construction",
    emoji: "🏗️",
    icon: "HardHat",
    color: "from-yellow-500 to-orange-400",
    services: [
      { id: 51, name: "Painting", categoryId: "construction", popular: true, description: "Interior and exterior house painting with premium paints and neat finishes.", priceRange: "R1 500–R8 000", duration: "1–3 days", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80" },
      { id: 52, name: "Interior painting", categoryId: "construction", description: "Walls, ceilings, skirting boards — colour consultation available.", priceRange: "R1 000–R5 000", duration: "1–2 days", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80" },
      { id: 53, name: "Exterior painting", categoryId: "construction", description: "Weather-resistant exterior painting with scaffolding and surface prep.", priceRange: "R2 000–R12 000", duration: "2–5 days", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?auto=format&fit=crop&w=400&q=80" },
      { id: 54, name: "Tiling installation", categoryId: "construction", description: "Floor and wall tiling for kitchens, bathrooms, and patios with grouting.", priceRange: "R800–R4 000", duration: "1–3 days", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" },
      { id: 55, name: "Floor installation", categoryId: "construction", description: "Laminate, vinyl, engineered wood, and tile floor installation.", priceRange: "R1 500–R8 000", duration: "1–3 days", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?auto=format&fit=crop&w=400&q=80" },
      { id: 56, name: "Ceiling installation", categoryId: "construction", description: "Suspended ceilings, cornices, bulkheads, and ceiling board replacement.", priceRange: "R1 000–R5 000", duration: "1–2 days", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80" },
      { id: 57, name: "Drywall installation", categoryId: "construction", description: "Partition walls, office dividers, and drywall patching with skim coat finish.", priceRange: "R800–R4 000", duration: "1–3 days", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80" },
      { id: 58, name: "Roofing repair", categoryId: "construction", popular: true, description: "Fix roof leaks, replace broken tiles, re-seal flashings, and gutter repairs.", priceRange: "R500–R5 000", duration: "2–8 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1632759145351-1d592919f522?auto=format&fit=crop&w=400&q=80" },
      { id: 59, name: "Waterproofing", categoryId: "construction", description: "Torch-on, liquid membrane, and acrylic waterproofing for roofs and walls.", priceRange: "R1 000–R6 000", duration: "1–3 days", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1607400201889-565b1ee75f8e?auto=format&fit=crop&w=400&q=80" },
      { id: 60, name: "Building contractor", categoryId: "construction", description: "Renovations, extensions, new builds — project management from plans to completion.", priceRange: "R10 000+", duration: "1–12 weeks", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "tech",
    name: "Tech & Digital",
    emoji: "💻",
    icon: "Laptop",
    color: "from-violet-500 to-purple-400",
    services: [
      { id: 61, name: "WiFi installation", categoryId: "tech", popular: true, description: "Fibre, LTE, or mesh WiFi setup with speed optimisation and device configuration.", priceRange: "R300–R1 500", duration: "1–2 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80" },
      { id: 62, name: "Router setup", categoryId: "tech", description: "Configure router, set up port forwarding, guest networks, and parental controls.", priceRange: "R200–R500", duration: "30 min–1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1606904825846-647eb07f5be2?auto=format&fit=crop&w=400&q=80" },
      { id: 63, name: "CCTV installation", categoryId: "tech", popular: true, description: "IP camera setup, NVR configuration, remote viewing, and motion alerts.", priceRange: "R1 500–R8 000", duration: "2–6 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80" },
      { id: 64, name: "Alarm system installation", categoryId: "tech", description: "Wireless alarm panels, sensors, panic buttons, and armed response linking.", priceRange: "R2 000–R6 000", duration: "2–4 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80" },
      { id: 65, name: "Smart home setup", categoryId: "tech", description: "Automate lights, locks, thermostats, and speakers with voice control integration.", priceRange: "R500–R5 000", duration: "1–4 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=400&q=80" },
      { id: 66, name: "Computer repair", categoryId: "tech", description: "Hardware diagnosis, virus removal, OS reinstall, and component upgrades.", priceRange: "R300–R1 000", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80" },
      { id: 67, name: "Laptop repair", categoryId: "tech", description: "Screen replacement, keyboard repair, battery swap, and overheating fixes.", priceRange: "R400–R2 500", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80" },
      { id: 68, name: "Printer repair", categoryId: "tech", description: "Fix paper jams, print head cleans, toner issues, and network printing setup.", priceRange: "R200–R600", duration: "30 min–1 hr", rating: 4.4, imageUrl: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80" },
      { id: 69, name: "Data recovery", categoryId: "tech", description: "Recover deleted files, crashed hard drives, and corrupted storage devices.", priceRange: "R500–R3 000", duration: "1–5 days", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80" },
      { id: 70, name: "IT support", categoryId: "tech", description: "Remote or on-site IT support for small businesses — email, networks, backups.", priceRange: "R400–R1 500", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "personal",
    name: "Personal & Lifestyle",
    emoji: "💇",
    icon: "Scissors",
    color: "from-pink-500 to-rose-400",
    services: [
      { id: 71, name: "Barber (mobile haircut)", categoryId: "personal", popular: true, description: "Professional barber comes to you — fades, lineups, beard trims, and hot towel shave.", priceRange: "R100–R350", duration: "30–45 min", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80" },
      { id: 72, name: "Hair stylist", categoryId: "personal", popular: true, description: "Blowouts, colour, braids, extensions, and special occasion styling at home.", priceRange: "R200–R1 500", duration: "1–3 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80" },
      { id: 73, name: "Makeup artist", categoryId: "personal", description: "Wedding, event, and editorial makeup application with premium products.", priceRange: "R500–R2 500", duration: "1–2 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=80" },
      { id: 74, name: "Nail technician", categoryId: "personal", description: "Gel nails, acrylics, manicures, pedicures, and nail art at your location.", priceRange: "R200–R800", duration: "1–2 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=400&q=80" },
      { id: 75, name: "Massage therapist", categoryId: "personal", popular: true, description: "Swedish, deep tissue, sports, and relaxation massage in your home.", priceRange: "R400–R1 200", duration: "1–2 hrs", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=400&q=80" },
      { id: 76, name: "Personal trainer", categoryId: "personal", description: "Customised workout plans and 1-on-1 training at home or outdoors.", priceRange: "R300–R800", duration: "1 hr", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80" },
      { id: 77, name: "Yoga instructor", categoryId: "personal", description: "Private or group yoga sessions — vinyasa, hatha, and restorative styles.", priceRange: "R250–R600", duration: "1 hr", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=400&q=80" },
      { id: 78, name: "Dietitian consultation", categoryId: "personal", description: "Personalised meal plans, nutritional assessments, and ongoing coaching.", priceRange: "R500–R1 200", duration: "1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80" },
      { id: 79, name: "Tattoo artist", categoryId: "personal", description: "Custom tattoo design and application — all styles from fine-line to traditional.", priceRange: "R500–R5 000", duration: "1–6 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1590246814883-57c511e76a2b?auto=format&fit=crop&w=400&q=80" },
      { id: 80, name: "Photographer", categoryId: "personal", description: "Portrait, event, product, and real estate photography with editing.", priceRange: "R800–R5 000", duration: "1–4 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "pet",
    name: "Pet Services",
    emoji: "🐾",
    icon: "PawPrint",
    color: "from-amber-500 to-yellow-400",
    services: [
      { id: 81, name: "Pet grooming", categoryId: "pet", popular: true, description: "Bath, haircut, nail trim, ear cleaning, and styling for dogs and cats.", priceRange: "R250–R600", duration: "1–2 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=400&q=80" },
      { id: 82, name: "Dog walking", categoryId: "pet", popular: true, description: "Solo or group walks in your neighbourhood with GPS tracking and photo updates.", priceRange: "R80–R200", duration: "30–60 min", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=400&q=80" },
      { id: 83, name: "Pet sitting", categoryId: "pet", description: "In-home pet sitting while you travel — feeding, playtime, and overnight care.", priceRange: "R200–R500/day", duration: "Full day", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80" },
      { id: 84, name: "Mobile vet", categoryId: "pet", description: "Vaccinations, health checks, and minor treatments at your home.", priceRange: "R400–R1 500", duration: "30 min–1 hr", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=400&q=80" },
      { id: 85, name: "Pet training", categoryId: "pet", description: "Obedience training, puppy socialisation, and behaviour correction.", priceRange: "R300–R800", duration: "1 hr", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "moving",
    name: "Moving & Delivery",
    emoji: "📦",
    icon: "Truck",
    color: "from-sky-500 to-blue-400",
    services: [
      { id: 86, name: "Moving services", categoryId: "moving", popular: true, description: "Full house and office moves — packing, loading, transport, and unpacking.", priceRange: "R2 000–R10 000", duration: "4–8 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=400&q=80" },
      { id: 87, name: "Furniture moving", categoryId: "moving", description: "Move individual items — couches, fridges, beds — with proper wrapping and care.", priceRange: "R500–R2 000", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80" },
      { id: 88, name: "Small parcel delivery", categoryId: "moving", description: "Same-day delivery for documents, parcels, and small packages across the city.", priceRange: "R50–R200", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=400&q=80" },
      { id: 89, name: "Courier service", categoryId: "moving", popular: true, description: "Reliable point-to-point courier for urgent deliveries with real-time tracking.", priceRange: "R100–R500", duration: "1–4 hrs", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&w=400&q=80" },
      { id: 90, name: "Grocery delivery", categoryId: "moving", description: "Personal shopper picks your groceries and delivers to your door.", priceRange: "R80–R200 + items", duration: "1–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "business",
    name: "Business & Professional",
    emoji: "💼",
    icon: "Briefcase",
    color: "from-slate-500 to-zinc-400",
    services: [
      { id: 91, name: "Accountant", categoryId: "business", description: "Bookkeeping, financial statements, payroll, and annual returns.", priceRange: "R500–R3 000", duration: "1–4 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80" },
      { id: 92, name: "Tax consultant", categoryId: "business", description: "Personal and business tax returns, tax planning, and SARS dispute resolution.", priceRange: "R500–R2 000", duration: "1–2 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=400&q=80" },
      { id: 93, name: "Legal consultation", categoryId: "business", description: "Contract review, dispute advice, estate planning, and legal opinions.", priceRange: "R800–R3 000", duration: "1–2 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
      { id: 94, name: "Business consultant", categoryId: "business", description: "Strategy, operations, and growth consulting for SMEs and startups.", priceRange: "R1 000–R5 000", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80" },
      { id: 95, name: "Marketing consultant", categoryId: "business", description: "Digital marketing strategy, social media plans, SEO audits, and ad campaigns.", priceRange: "R800–R5 000", duration: "1–3 hrs", rating: 4.6, imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "emergency",
    name: "Emergency",
    emoji: "🚨",
    icon: "Siren",
    color: "from-red-500 to-rose-400",
    services: [
      { id: 96, name: "Emergency electrician", categoryId: "emergency", popular: true, description: "24/7 callout for power outages, tripped mains, sparking outlets, and fire hazards.", priceRange: "R600–R2 000", duration: "30 min–2 hrs", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80" },
      { id: 97, name: "Emergency plumber", categoryId: "emergency", popular: true, description: "Burst pipes, geyser explosions, sewage floods — rapid 24/7 response.", priceRange: "R600–R2 500", duration: "30 min–2 hrs", rating: 4.9, imageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80" },
      { id: 98, name: "Emergency locksmith", categoryId: "emergency", description: "Immediate lockout assistance for homes, offices, and vehicles 24/7.", priceRange: "R400–R1 200", duration: "20–45 min", rating: 4.7, imageUrl: "https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=400&q=80" },
      { id: 99, name: "Roadside assistance", categoryId: "emergency", popular: true, description: "Jump starts, flat tyre changes, fuel delivery, and towing on-call.", priceRange: "R300–R1 500", duration: "20 min–1 hr", rating: 4.8, imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&w=400&q=80" },
      { id: 100, name: "Emergency generator repair", categoryId: "emergency", description: "Diesel and petrol generator diagnostics, repairs, and emergency startup.", priceRange: "R500–R3 000", duration: "1–3 hrs", rating: 4.5, imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80" },
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

export function getServiceById(id: number): ServiceItem | undefined {
  return ALL_SERVICES.find((s) => s.id === id);
}
