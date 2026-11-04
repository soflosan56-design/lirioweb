export type Section =
  | 'inicio'
  | 'swap'
  | 'showroom'
  | 'armarios'
  | 'armario'
  | 'contenidos'
  | 'suscripciones'
  | 'contacto'
  | 'admin';

export type Profile = {
  id: string;
  display_name: string;
  city: string | null;
  style: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export type ProfileEdits = Pick<Profile, 'display_name' | 'city' | 'style' | 'bio' | 'avatar_url'>;

export type GarmentDetails = {
  brand: string | null;
  size: string | null;
  condition: string | null;
  material: string | null;
  description: string | null;
};

export type SwapListing = GarmentDetails & {
  id: string;
  owner_id: string;
  title: string;
  image_urls: string[];
  wanted: string | null;
  estimated_value: number | null;
  created_at: string;
};

export type SwapBid = GarmentDetails & {
  id: string;
  listing_id: string;
  bidder_id: string;
  offer_title: string;
  offer_value: number;
  offer_image_urls: string[];
  message: string | null;
  created_at: string;
};

export type SwapMessage = {
  id: string;
  listing_id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
};

export type ConversationTarget = {
  listingId: string;
  listingTitle: string;
  otherId: string;
};

export type Brand = {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  tagline: string | null;
  image_url: string | null;
  image_urls: string[];
};

export type Product = {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  size: string | null;
  price_cents: number;
  rent_cents: number | null;
  image_url: string | null;
  image_urls: string[];
  brand: Pick<Brand, 'id' | 'name'> | null;
};

export type CartMode = 'buy' | 'rent';

export type CartItem = {
  id: string;
  owner_id: string;
  product_id: string;
  mode: CartMode;
  quantity: number;
  product: Product;
};

export type ContentKind = 'podcast' | 'article';

export type ContentItem = {
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  body: string | null;
  category: string | null;
  image_url: string | null;
  video_url: string | null;
  duration_label: string | null;
  episode_number: number | null;
  featured: boolean;
  published_at: string;
};

export type WardrobeItem = GarmentDetails & {
  id: string;
  owner_id: string;
  name: string;
  image_url: string;
  created_at: string;
};

export type DestinationId = 'swap' | 'showroom' | 'contenidos';

export type SitePlan = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
};

export type SiteFaq = {
  question: string;
  answer: string;
};

export type HomeBlock =
  | { id: string; type: 'photo'; imageUrl: string; caption: string; linkUrl: string }
  | { id: string; type: 'text'; body: string }
  | { id: string; type: 'title'; title: string; subtitle: string }
  | { id: string; type: 'link'; label: string; url: string };

export type HomeBlockType = HomeBlock['type'];

export type SiteSettings = {
  theme: {
    colors: { primary: string; accent: string; ink: string; paper: string };
    fonts: { display: string; body: string; hand: string };
    logoUrl: string;
    customFonts: { name: string; url: string }[];
  };
  home: {
    intro: string;
    blocks: HomeBlock[];
    coverImageUrl: string;
    polaroidImageUrl: string;
    destinations: Record<DestinationId, { blurb: string; imageUrl: string }>;
  };
  subscriptions: {
    title: string;
    intro: string;
    note: string;
    plans: SitePlan[];
    faq: SiteFaq[];
  };
  contact: {
    title: string;
    intro: string;
    email: string;
  };
};

