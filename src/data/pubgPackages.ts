export interface PubgPackage {
  id: string;
  type: 'uc';
  name: string;
  quantity: number;
  price: number;
  currency: string;
  icon: string;
}

export const pubgPackages: PubgPackage[] = [
  { id: 'uc1', type: 'uc', name: '60 UC', quantity: 60, price: 146, currency: '₹', icon: '⚡' },
  { id: 'uc2', type: 'uc', name: '120 UC', quantity: 120, price: 292, currency: '₹', icon: '⚡' },
  { id: 'uc3', type: 'uc', name: '240 UC', quantity: 240, price: 547, currency: '₹', icon: '⚡' },
  { id: 'uc4', type: 'uc', name: '325 UC', quantity: 325, price: 698, currency: '₹', icon: '⚡' },
  { id: 'uc5', type: 'uc', name: '660 UC', quantity: 660, price: 1446, currency: '₹', icon: '⚡' },
  { id: 'uc6', type: 'uc', name: '720 UC', quantity: 720, price: 1543, currency: '₹', icon: '⚡' },
  { id: 'uc7', type: 'uc', name: '1500 UC', quantity: 1500, price: 3276, currency: '₹', icon: '⚡' },
  { id: 'uc8', type: 'uc', name: '1800 UC', quantity: 1800, price: 3588, currency: '₹', icon: '⚡' },
  { id: 'uc9', type: 'uc', name: '3850 UC', quantity: 3850, price: 6767, currency: '₹', icon: '⚡' },
  { id: 'uc10', type: 'uc', name: '8100 UC', quantity: 8100, price: 13878, currency: '₹', icon: '⚡' },
];
