export interface Shop {
  id: string;
  name: string;
  phone: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
}

export interface ShopInput {
  name: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}
