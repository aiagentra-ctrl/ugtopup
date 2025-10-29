export interface NetflixPackage {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

export const netflixPackages: NetflixPackage[] = [
  { 
    id: 'nf1', 
    name: '1 Month Netflix', 
    duration: '1 Month', 
    price: 399, 
    currency: '₹' 
  },
  { 
    id: 'nf3', 
    name: '3 Months Netflix', 
    duration: '3 Months', 
    price: 1199, 
    currency: '₹' 
  },
  { 
    id: 'nf6', 
    name: '6 Months Netflix', 
    duration: '6 Months', 
    price: 2299, 
    currency: '₹' 
  },
  { 
    id: 'nf12', 
    name: '12 Months Netflix', 
    duration: '12 Months', 
    price: 4499, 
    currency: '₹' 
  },
];
