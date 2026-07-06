export interface SubService {
  id: string;
  name: string;
  brandName?: string;
  accentColor: string; // hex code
  textColor: string; // hex code for text
  tailwindColor: string; // tailwind color prefix (e.g. "emerald", "blue", "orange")
  description: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  skills: string[];
  description: string;
  mediaType: 'image' | 'pdf' | 'video';
  mediaUrl: string; // local or mock url
  mediaTitle?: string; // friendly title for doc preview
  thumbnailUrl: string; // local or mock url
}

export interface Service {
  id: string;
  name: string;
  brandLogo?: string; // icon name or logo path
  accentColor: string; // hex color code
  textColor: string; // text hex color code
  tailwindColor: string; // tailwind color prefix (e.g. "emerald", "blue", "violet")
  shortDesc: string;
  overallDescription: string;
  subServices?: SubService[];
  portfolio: PortfolioItem[];
  iconName: string; // lucide icon name
}

export interface Rating {
  id: string;
  name: string;
  avatarUrl?: string; // optional
  designation: string;
  company: string;
  country: string;
  serviceId: string; // associated service ID
  rating: number; // e.g. 5
  comment: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  pictureUrl: string;
  experience: string;
  isOnline: boolean;
  certifications: string[]; // Achievements tied to individuals
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  year: string;
  logoUrl?: string;
}

export interface ResourceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  fileSize: string;
  fileType: string;
  downloadCount: number;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
