export interface DesignPackage {
  id: string;
  type: 'logo' | 'post' | 'banner' | 'thumbnail';
  name: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  deliveryTime: string;
  icon: string;
}

export const logoDesignPackage: DesignPackage = {
  id: 'logo-design-1',
  type: 'logo',
  name: 'Professional Logo Design',
  description: 'Custom logo design with unlimited revisions',
  price: 997,
  currency: '₹',
  features: [
    '3 Initial Design Concepts',
    'Unlimited Revisions',
    'High Resolution Files',
    'Vector Files (AI, EPS, SVG)',
    'Social Media Kit',
    'Brand Guidelines'
  ],
  deliveryTime: '3-5 business days',
  icon: '🎨'
};

export const postDesignPackage: DesignPackage = {
  id: 'post-design-1',
  type: 'post',
  name: 'Social Media Post Design',
  description: 'Eye-catching social media posts',
  price: 504,
  currency: '₹',
  features: [
    '5 Post Designs',
    '2 Revisions Per Design',
    'Instagram, Facebook Ready',
    'Source Files Included',
    'Trending Templates'
  ],
  deliveryTime: '2-3 business days',
  icon: '📱'
};

export const bannerDesignPackage: DesignPackage = {
  id: 'banner-design-1',
  type: 'banner',
  name: 'Banner Design',
  description: 'Professional banners for web & ads',
  price: 478,
  currency: '₹',
  features: [
    'Custom Banner Design',
    'Web & Social Media Sizes',
    '3 Revisions',
    'Print Ready Files',
    'Fast Delivery'
  ],
  deliveryTime: '2-3 business days',
  icon: '🎪'
};

export const thumbnailDesignPackage: DesignPackage = {
  id: 'thumbnail-design-1',
  type: 'thumbnail',
  name: 'YouTube Thumbnail Design',
  description: 'Click-worthy YouTube thumbnails',
  price: 502,
  currency: '₹',
  features: [
    '3 Thumbnail Designs',
    'HD Quality (1920x1080)',
    '2 Revisions Each',
    'Eye-Catching Graphics',
    'Quick Turnaround'
  ],
  deliveryTime: '1-2 business days',
  icon: '🎬'
};
