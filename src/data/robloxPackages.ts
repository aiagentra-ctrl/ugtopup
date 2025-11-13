export interface RobloxPackage {
  id: string;
  type: 'robux';
  name: string;
  quantity: number;
  price: number;
  currency: string;
  icon: string;
}

export const robloxPackages: RobloxPackage[] = [
  { id: 'rb1', type: 'robux', name: '1000 Robux', quantity: 1000, price: 1499, currency: '₹', icon: '💎' },
  { id: 'rb2', type: 'robux', name: '2000 Robux', quantity: 2000, price: 2999, currency: '₹', icon: '💎' },
  { id: 'rb3', type: 'robux', name: '3000 Robux', quantity: 3000, price: 4499, currency: '₹', icon: '💎' },
  { id: 'rb4', type: 'robux', name: '4000 Robux', quantity: 4000, price: 5999, currency: '₹', icon: '💎' },
  { id: 'rb5', type: 'robux', name: '5000 Robux', quantity: 5000, price: 7499, currency: '₹', icon: '💎' },
];
