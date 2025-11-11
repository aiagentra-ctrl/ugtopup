export interface MLPackage {
  id: string;
  type: 'diamond' | 'special';
  name: string;
  quantity: number;
  price: number;
  currency: string;
  icon: string;
}

export const mlDiamondPackages: MLPackage[] = [
  { id: 'ml1', type: 'diamond', name: '55 Diamonds', quantity: 55, price: 133, currency: '₹', icon: '💎' },
  { id: 'ml2', type: 'diamond', name: '86 Diamonds', quantity: 86, price: 187, currency: '₹', icon: '💎' },
  { id: 'ml3', type: 'diamond', name: '110 Diamonds', quantity: 110, price: 254, currency: '₹', icon: '💎' },
  { id: 'ml4', type: 'diamond', name: '165 Diamonds', quantity: 165, price: 383, currency: '₹', icon: '💎' },
  { id: 'ml5', type: 'diamond', name: '172 Diamonds', quantity: 172, price: 363, currency: '₹', icon: '💎' },
  { id: 'ml6', type: 'diamond', name: '257 Diamonds', quantity: 257, price: 578, currency: '₹', icon: '💎' },
  { id: 'ml7', type: 'diamond', name: '344 Diamonds', quantity: 344, price: 718, currency: '₹', icon: '💎' },
  { id: 'ml8', type: 'diamond', name: '430 Diamonds', quantity: 430, price: 938, currency: '₹', icon: '💎' },
  { id: 'ml9', type: 'diamond', name: '514 Diamonds', quantity: 514, price: 1048, currency: '₹', icon: '💎' },
  { id: 'ml10', type: 'diamond', name: '706 Diamonds', quantity: 706, price: 1382, currency: '₹', icon: '💎' },
  { id: 'ml11', type: 'diamond', name: '1050 Diamonds', quantity: 1050, price: 2117, currency: '₹', icon: '💎' },
  { id: 'ml12', type: 'diamond', name: '1412 Diamonds', quantity: 1412, price: 2787, currency: '₹', icon: '💎' },
  { id: 'ml13', type: 'diamond', name: '2215 Diamonds', quantity: 2215, price: 4204, currency: '₹', icon: '💎' },
  { id: 'ml14', type: 'diamond', name: '3688 Diamonds', quantity: 3688, price: 7107, currency: '₹', icon: '💎' },
  { id: 'ml15', type: 'diamond', name: '5532 Diamonds', quantity: 5532, price: 10503, currency: '₹', icon: '💎' },
  { id: 'ml16', type: 'diamond', name: '9288 Diamonds', quantity: 9288, price: 17509, currency: '₹', icon: '💎' },
];

export const mlSpecialDeals: MLPackage[] = [
  { id: 'mls1', type: 'special', name: 'Weekly', quantity: 1, price: 248, currency: '₹', icon: '' },
  { id: 'mls2', type: 'special', name: 'Twilight', quantity: 1, price: 1198, currency: '₹', icon: '' },
];
