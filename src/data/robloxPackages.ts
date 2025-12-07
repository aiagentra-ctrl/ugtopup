export interface RobloxPackage {
  id: string;
  type: 'robux';
  name: string;
  quantity: number;
  price: number;
  currency: string;
}

export const robloxPackages: RobloxPackage[] = [
  { id: 'rb1', type: 'robux', name: '1000 Robux', quantity: 1000, price: 1574, currency: '₹' },
  { id: 'rb2', type: 'robux', name: '2000 Robux', quantity: 2000, price: 3148, currency: '₹' },
  { id: 'rb3', type: 'robux', name: '3000 Robux', quantity: 3000, price: 4722, currency: '₹' },
  { id: 'rb4', type: 'robux', name: '4000 Robux', quantity: 4000, price: 6296, currency: '₹' },
  { id: 'rb5', type: 'robux', name: '5000 Robux', quantity: 5000, price: 7868, currency: '₹' },
];
