export interface Package {
  id: string;
  type: 'diamond' | 'subscription' | 'zone' | 'pass' | 'topup' | 'special';
  name: string;
  quantity: number;
  price: number;
  currency: '💵' | '💸';
}

// New Top-up Packages (Main Diamond Packages)
export const topUpPackages: Package[] = [
  { id: 'tu1', type: 'topup', name: '25 Diamonds', quantity: 25, price: 29, currency: '💵' },
  { id: 'tu2', type: 'topup', name: '50 Diamonds', quantity: 50, price: 48, currency: '💵' },
  { id: 'tu3', type: 'topup', name: '115 Diamonds', quantity: 115, price: 93, currency: '💵' },
  { id: 'tu4', type: 'topup', name: '240 Diamonds', quantity: 240, price: 185, currency: '💵' },
  { id: 'tu5', type: 'topup', name: '355 Diamonds', quantity: 355, price: 267, currency: '💵' },
  { id: 'tu6', type: 'topup', name: '480 Diamonds', quantity: 480, price: 366, currency: '💵' },
  { id: 'tu7', type: 'topup', name: '610 Diamonds', quantity: 610, price: 456, currency: '💵' },
  { id: 'tu8', type: 'topup', name: '725 Diamonds', quantity: 725, price: 562, currency: '💵' },
  { id: 'tu9', type: 'topup', name: '850 Diamonds', quantity: 850, price: 648, currency: '💵' },
  { id: 'tu10', type: 'topup', name: '1090 Diamonds', quantity: 1090, price: 832, currency: '💵' },
  { id: 'tu11', type: 'topup', name: '1240 Diamonds', quantity: 1240, price: 926, currency: '💵' },
  { id: 'tu12', type: 'topup', name: '1480 Diamonds', quantity: 1480, price: 1123, currency: '💵' },
  { id: 'tu13', type: 'topup', name: '1595 Diamonds', quantity: 1595, price: 1227, currency: '💵' },
  { id: 'tu14', type: 'topup', name: '2090 Diamonds', quantity: 2090, price: 1596, currency: '💵' },
  { id: 'tu15', type: 'topup', name: '2530 Diamonds', quantity: 2530, price: 1834, currency: '💵' },
  { id: 'tu16', type: 'topup', name: '5060 Diamonds', quantity: 5060, price: 3666, currency: '💵' },
  { id: 'tu17', type: 'topup', name: '10120 Diamonds', quantity: 10120, price: 7328, currency: '💵' },
];

// Special Deals
export const specialDeals: Package[] = [
  { id: 'sd1', type: 'special', name: 'Weekly', quantity: 1, price: 184, currency: '💵' },
  { id: 'sd2', type: 'special', name: 'Monthly', quantity: 1, price: 922, currency: '💵' },
  { id: 'sd3', type: 'special', name: 'Full Level Up', quantity: 1, price: 523, currency: '💵' },
  { id: 'sd4', type: 'special', name: 'Weekly Lite', quantity: 1, price: 63, currency: '💵' },
];

export const diamondPackages: Package[] = [
  { id: 'd1', type: 'diamond', name: '25 Diamonds', quantity: 25, price: 29, currency: '💵' },
  { id: 'd2', type: 'diamond', name: '50 Diamonds', quantity: 50, price: 48, currency: '💵' },
  { id: 'd3', type: 'diamond', name: '115 Diamonds', quantity: 115, price: 93, currency: '💵' },
  { id: 'd4', type: 'diamond', name: '240 Diamonds', quantity: 240, price: 185, currency: '💵' },
  { id: 'd5', type: 'diamond', name: '355 Diamonds', quantity: 355, price: 267, currency: '💵' },
  { id: 'd6', type: 'diamond', name: '480 Diamonds', quantity: 480, price: 366, currency: '💵' },
  { id: 'd7', type: 'diamond', name: '610 Diamonds', quantity: 610, price: 456, currency: '💵' },
  { id: 'd8', type: 'diamond', name: '725 Diamonds', quantity: 725, price: 562, currency: '💵' },
  { id: 'd9', type: 'diamond', name: '850 Diamonds', quantity: 850, price: 648, currency: '💵' },
  { id: 'd10', type: 'diamond', name: '965 Diamonds', quantity: 965, price: 747, currency: '💵' },
  { id: 'd11', type: 'diamond', name: '1090 Diamonds', quantity: 1090, price: 832, currency: '💵' },
  { id: 'd12', type: 'diamond', name: '1240 Diamonds', quantity: 1240, price: 926, currency: '💵' },
  { id: 'd13', type: 'diamond', name: '1480 Diamonds', quantity: 1480, price: 1123, currency: '💵' },
  { id: 'd14', type: 'diamond', name: '1595 Diamonds', quantity: 1595, price: 1227, currency: '💵' },
  { id: 'd15', type: 'diamond', name: '1720 Diamonds', quantity: 1720, price: 1329, currency: '💵' },
  { id: 'd16', type: 'diamond', name: '1960 Diamonds', quantity: 1960, price: 1517, currency: '💵' },
  { id: 'd17', type: 'diamond', name: '2090 Diamonds', quantity: 2090, price: 1596, currency: '💵' },
  { id: 'd18', type: 'diamond', name: '2530 Diamonds', quantity: 2530, price: 1834, currency: '💵' },
  { id: 'd19', type: 'diamond', name: '5060 Diamonds', quantity: 5060, price: 3666, currency: '💵' },
  { id: 'd20', type: 'diamond', name: '10120 Diamonds', quantity: 10120, price: 7328, currency: '💵' },
];

export const subscriptionPackages: Package[] = [
  { id: 's1', type: 'subscription', name: 'Weekly', quantity: 1, price: 184, currency: '💵' },
  { id: 's2', type: 'subscription', name: 'Monthly', quantity: 1, price: 922, currency: '💵' },
  { id: 's3', type: 'subscription', name: 'Full Level Up', quantity: 1, price: 523, currency: '💵' },
  { id: 's4', type: 'subscription', name: 'Weekly Lite', quantity: 1, price: 63, currency: '💵' },
];

export const zonePackages: Package[] = [
  { id: 'z1', type: 'zone', name: '86 Diamonds', quantity: 86, price: 173, currency: '💸' },
  { id: 'z2', type: 'zone', name: '172 Diamonds', quantity: 172, price: 356, currency: '💸' },
  { id: 'z3', type: 'zone', name: '257 Diamonds', quantity: 257, price: 567, currency: '💸' },
  { id: 'z4', type: 'zone', name: '344 Diamonds', quantity: 344, price: 716, currency: '💸' },
  { id: 'z5', type: 'zone', name: '514 Diamonds', quantity: 514, price: 1067, currency: '💸' },
  { id: 'z6', type: 'zone', name: '706 Diamonds', quantity: 706, price: 1366, currency: '💸' },
  { id: 'z7', type: 'zone', name: '1050 Diamonds', quantity: 1050, price: 2036, currency: '💸' },
  { id: 'z8', type: 'zone', name: '1412 Diamonds', quantity: 1412, price: 2687, currency: '💸' },
  { id: 'z9', type: 'zone', name: '2195 Diamonds', quantity: 2195, price: 3923, currency: '💸' },
  { id: 'z10', type: 'zone', name: '3688 Diamonds', quantity: 3688, price: 6733, currency: '💸' },
  { id: 'z11', type: 'zone', name: '5532 Diamonds', quantity: 5532, price: 10102, currency: '💸' },
  { id: 'z12', type: 'zone', name: '9288 Diamonds', quantity: 9288, price: 16678, currency: '💸' },
];

export const specialPassPackages: Package[] = [
  { id: 'p1', type: 'pass', name: 'Weekly Pass', quantity: 1, price: 228, currency: '💸' },
  { id: 'p2', type: 'pass', name: 'Twilight Pass', quantity: 1, price: 1164, currency: '💸' },
];

export const allPackages = [
  ...diamondPackages,
  ...subscriptionPackages,
  ...zonePackages,
  ...specialPassPackages,
];
