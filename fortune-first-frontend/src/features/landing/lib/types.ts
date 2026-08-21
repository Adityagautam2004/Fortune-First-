export interface PublicReturn {
  month: number;
  year: number;
  return_pct: number;
  notes: string | null;
}

export interface Testimonial {
  client_name: string;
  city: string | null;
  content: string;
  rating: number;
}

export interface PublicDashboardData {
  returns: PublicReturn[];
  testimonials: Testimonial[];
}
