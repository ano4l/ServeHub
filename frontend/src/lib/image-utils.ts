// Enhanced image utilities for the explore page
import { useState, useMemo, useEffect } from "react";

export interface ImageCategory {
  name: string;
  keywords: string[];
  fallbackColor: string;
}

export const SERVICE_CATEGORIES: Record<string, ImageCategory> = {
  "Plumbing": {
    name: "Plumbing",
    keywords: ["plumber-fixing-pipe", "plumbing-work", "pipe-repair", "water-pipes", "plumbing-tools", "bathroom-plumbing"],
    fallbackColor: "from-blue-400 to-blue-600"
  },
  "Electrical": {
    name: "Electrical",
    keywords: ["electrician-working", "electrical-wiring", "circuit-breaker", "electrical-work", "power-tools", "electrical-panel"],
    fallbackColor: "from-yellow-400 to-orange-500"
  },
  "Cleaning": {
    name: "Cleaning",
    keywords: ["cleaning-service", "house-cleaning", "professional-cleaning", "cleaning-tools", "maid-service", "office-cleaning"],
    fallbackColor: "from-green-400 to-teal-500"
  },
  "Landscaping": {
    name: "Landscaping",
    keywords: ["gardener-working", "landscaping-service", "lawn-care", "garden-design", "tree-trimming", "outdoor-garden"],
    fallbackColor: "from-emerald-400 to-green-600"
  },
  "Painting": {
    name: "Painting",
    keywords: ["painter-working", "house-painting", "wall-painting", "paint-roller", "interior-painting", "exterior-painting"],
    fallbackColor: "from-purple-400 to-pink-500"
  },
  "Carpentry": {
    name: "Carpentry",
    keywords: ["carpenter-working", "woodworking", "furniture-making", "carpentry-tools", "wood-construction", "custom-cabinets"],
    fallbackColor: "from-amber-400 to-orange-600"
  },
  "Roofing": {
    name: "Roofing",
    keywords: ["roofer-working", "roof-repair", "roof-installation", "roofing-materials", "house-roof", "roof-construction"],
    fallbackColor: "from-red-400 to-rose-600"
  },
  "HVAC": {
    name: "HVAC",
    keywords: ["hvac-technician", "air-conditioning", "heating-system", "hvac-installation", "ac-repair", "ventilation-system"],
    fallbackColor: "from-cyan-400 to-blue-500"
  },
  "Pest Control": {
    name: "Pest Control",
    keywords: ["pest-control-service", "exterminator-working", "pest-spray", "termite-treatment", "bug-control", "pest-inspection"],
    fallbackColor: "from-lime-400 to-green-500"
  },
  "Moving": {
    name: "Moving",
    keywords: ["movers-working", "moving-service", "relocation-truck", "packing-boxes", "furniture-moving", "moving-company"],
    fallbackColor: "from-indigo-400 to-purple-600"
  },
  "Appliance Repair": {
    name: "Appliance Repair",
    keywords: ["appliance-repair", "washing-machine-repair", "refrigerator-repair", "appliance-technician", "kitchen-appliances", "repair-tools"],
    fallbackColor: "from-orange-400 to-red-500"
  },
  "Home Security": {
    name: "Home Security",
    keywords: ["security-technician", "home-security", "security-camera", "alarm-system", "smart-home", "security-installation"],
    fallbackColor: "from-gray-400 to-gray-600"
  },
  "Pool Maintenance": {
    name: "Pool Maintenance",
    keywords: ["pool-cleaning", "pool-maintenance", "pool-service", "swimming-pool", "pool-equipment", "pool-technician"],
    fallbackColor: "from-cyan-300 to-blue-400"
  },
  "Window Cleaning": {
    name: "Window Cleaning",
    keywords: ["window-cleaner", "window-cleaning-service", "glass-cleaning", "professional-window", "cleaning-windows", "window-tools"],
    fallbackColor: "from-sky-400 to-blue-500"
  },
  "Flooring": {
    name: "Flooring",
    keywords: ["flooring-installation", "hardwood-floors", "tile-installation", "flooring-contractor", "carpet-installation", "flooring-materials"],
    fallbackColor: "from-brown-400 to-amber-600"
  },
  "General": {
    name: "General",
    keywords: ["handyman-working", "home-repair", "maintenance-service", "general-contractor", "home-improvement", "repair-tools"],
    fallbackColor: "from-gray-400 to-slate-600"
  }
};

export function generateImageUrl(category: string, index: number, size: { width: number; height: number } = { width: 900, height: 1400 }): string {
  const categoryInfo = SERVICE_CATEGORIES[category] || SERVICE_CATEGORIES["General"];
  const keyword = categoryInfo.keywords[index % categoryInfo.keywords.length];
  const seed = `servehub-${category.toLowerCase()}-${keyword}-${index}`;
  
  return `https://picsum.photos/seed/${seed}/${size.width}/${size.height}`;
}

export function generateFallbackGradient(category: string): string {
  const categoryInfo = SERVICE_CATEGORIES[category] || SERVICE_CATEGORIES["General"];
  return categoryInfo.fallbackColor;
}

export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

export function createImageLoader(category: string, index: number) {
  const imageUrl = generateImageUrl(category, index);
  const fallbackGradient = generateFallbackGradient(category);
  
  return {
    url: imageUrl,
    fallback: fallbackGradient,
    preload: () => preloadImage(imageUrl)
  };
}

// Progressive image loading hook
export function useProgressiveImage(category: string, index: number) {
  const [loadingState, setLoadingState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const { url, fallback, preload } = useMemo(() => createImageLoader(category, index), [category, index]);
  
  useEffect(() => {
    setLoadingState('loading');
    preload()
      .then(() => setLoadingState('loaded'))
      .catch(() => setLoadingState('error'));
  }, [preload]);
  
  return {
    url,
    fallback,
    loadingState,
    isLoading: loadingState === 'loading',
    isLoaded: loadingState === 'loaded',
    hasError: loadingState === 'error'
  };
}
