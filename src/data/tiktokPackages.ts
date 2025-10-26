export interface TikTokPackage {
  id: string;
  type: 'coins';
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

export const tiktokCoinPackages: TikTokPackage[] = [
  { id: 'tk1', type: 'coins', name: '350 Coins', quantity: 350, price: 525, currency: '₹' },
  { id: 'tk2', type: 'coins', name: '700 Coins', quantity: 700, price: 1274, currency: '₹' },
  { id: 'tk3', type: 'coins', name: '1,000 Coins', quantity: 1000, price: 1862, currency: '₹' },
  { id: 'tk4', type: 'coins', name: '1,500 Coins', quantity: 1500, price: 2498, currency: '₹' },
  { id: 'tk5', type: 'coins', name: '2,000 Coins', quantity: 2000, price: 3474, currency: '₹' },
  { id: 'tk6', type: 'coins', name: '5,000 Coins', quantity: 5000, price: 8327, currency: '₹' },
  { id: 'tk7', type: 'coins', name: '7,000 Coins', quantity: 7000, price: 11729, currency: '₹' },
  { id: 'tk8', type: 'coins', name: '10,000 Coins', quantity: 10000, price: 16876, currency: '₹' },
  { id: 'tk9', type: 'coins', name: '14,000 Coins', quantity: 14000, price: 23358, currency: '₹' },
  { id: 'tk10', type: 'coins', name: '21,000 Coins', quantity: 21000, price: 34427, currency: '₹' },
];
