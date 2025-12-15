import { api } from './client';

export interface RoomPrice {
  id: string;
  roomType: string;
  size: string;
  typicalSqft: number;
  wallsOnly: number;
  wallsTrim: number;
  wallsTrimCeiling: number;
  fullRefresh: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExteriorPrice {
  id: string;
  surfaceType: string;
  pricePerSqft: number;
  prepMultiplier: number;
  createdAt: string;
  updatedAt: string;
}

export interface Addon {
  id: string;
  name: string;
  category: 'interior' | 'exterior' | 'both';
  unit: string;
  basePrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomPriceRequest {
  roomType: string;
  size: string;
  typicalSqft: number;
  wallsOnly: number;
  wallsTrim: number;
  wallsTrimCeiling: number;
  fullRefresh: number;
}

export interface CreateExteriorPriceRequest {
  surfaceType: string;
  pricePerSqft: number;
  prepMultiplier?: number;
}

export interface CreateAddonRequest {
  name: string;
  category?: 'interior' | 'exterior' | 'both';
  unit: string;
  basePrice: number;
}

export const priceBookApi = {
  // Room Prices
  rooms: {
    async list() {
      return api.get<RoomPrice[]>('/price-book/rooms');
    },
    async get(id: string) {
      return api.get<RoomPrice>(`/price-book/rooms/${id}`);
    },
    async create(data: CreateRoomPriceRequest) {
      return api.post<RoomPrice>('/price-book/rooms', data);
    },
    async update(id: string, data: Partial<CreateRoomPriceRequest>) {
      return api.patch<RoomPrice>(`/price-book/rooms/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/price-book/rooms/${id}`);
    },
  },

  // Exterior Prices
  exterior: {
    async list() {
      return api.get<ExteriorPrice[]>('/price-book/exterior');
    },
    async get(id: string) {
      return api.get<ExteriorPrice>(`/price-book/exterior/${id}`);
    },
    async create(data: CreateExteriorPriceRequest) {
      return api.post<ExteriorPrice>('/price-book/exterior', data);
    },
    async update(id: string, data: Partial<CreateExteriorPriceRequest>) {
      return api.patch<ExteriorPrice>(`/price-book/exterior/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/price-book/exterior/${id}`);
    },
  },

  // Addons
  addons: {
    async list(category?: 'interior' | 'exterior' | 'both') {
      const query = category ? `?category=${category}` : '';
      return api.get<Addon[]>(`/price-book/addons${query}`);
    },
    async get(id: string) {
      return api.get<Addon>(`/price-book/addons/${id}`);
    },
    async create(data: CreateAddonRequest) {
      return api.post<Addon>('/price-book/addons', data);
    },
    async update(id: string, data: Partial<CreateAddonRequest>) {
      return api.patch<Addon>(`/price-book/addons/${id}`, data);
    },
    async delete(id: string) {
      return api.delete<{ message: string }>(`/price-book/addons/${id}`);
    },
  },
};
