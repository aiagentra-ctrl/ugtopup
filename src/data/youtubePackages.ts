export interface YouTubePackage {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

export const youtubePackages: YouTubePackage[] = [
  { 
    id: 'yt1', 
    name: '1 Month YouTube Premium', 
    duration: '1 Month', 
    price: 499, 
    currency: '₹' 
  },
  { 
    id: 'yt3', 
    name: '3 Months YouTube Premium', 
    duration: '3 Months', 
    price: 1499, 
    currency: '₹' 
  },
  { 
    id: 'yt6', 
    name: '6 Months YouTube Premium', 
    duration: '6 Months', 
    price: 2999, 
    currency: '₹' 
  },
  { 
    id: 'yt12', 
    name: '1 Year YouTube Premium', 
    duration: '1 Year', 
    price: 5999, 
    currency: '₹' 
  },
];
