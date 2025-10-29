export interface ChatGPTPackage {
  id: string;
  name: string;
  duration: string;
  price: number;
  currency: string;
}

export const chatgptPackages: ChatGPTPackage[] = [
  { 
    id: 'cgpt1', 
    name: '1 Month ChatGPT Plus', 
    duration: '1 Month', 
    price: 1299, 
    currency: '₹' 
  },
  { 
    id: 'cgpt3', 
    name: '3 Months ChatGPT Plus', 
    duration: '3 Months', 
    price: 2999, 
    currency: '₹' 
  },
];
