export interface Provider {
  id: number;
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  role?: string;
}
