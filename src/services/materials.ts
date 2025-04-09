import apiInstance from '@/lib/axios';

export interface Material {
  material_id: string;
  name: string;
  description: string;
  unit_price: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface MaterialListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MaterialListResponse {
  data: Material[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}

export interface CreateMaterialData {
  name: string;
  description: string;
  unit_price: string;
  stock_quantity: number;
}

export interface UpdateMaterialData {
  name?: string;
  description?: string;
  unit_price?: string;
  stock_quantity?: number;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface MaterialResponse {
  isSuccess: boolean;
  message: string;
  data: {
    data: Material[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export const materialsApi = {
  getMaterialList: async (params: MaterialListParams): Promise<MaterialResponse> => {
    const response = await apiInstance.get<MaterialResponse>('/materials', { params });
    return response.data;
  },

  getMaterialById: async (materialId: string): Promise<Material> => {
    const response = await apiInstance.get<Material>(`/materials/${materialId}`);
    return response.data;
  },

  createMaterial: async (data: CreateMaterialData): Promise<Material> => {
    const response = await apiInstance.post<Material>('/materials', data);
    return response.data;
  },

  updateMaterial: async (materialId: string, data: Partial<Material>): Promise<Material> => {
    const response = await apiInstance.put<Material>(`/materials/${materialId}`, data);
    return response.data;
  },

  updateUnitPrice: async (materialId: string, unitPrice: string): Promise<Material> => {
    const response = await apiInstance.put<Material>(`/materials/${materialId}/unit-price`, {
      unit_price: unitPrice,
    });
    return response.data;
  },

  updateStockQuantity: async (materialId: string, stockQuantity: number): Promise<Material> => {
    const response = await apiInstance.put<Material>(`/materials/${materialId}/stock-quantity`, {
      stock_quantity: stockQuantity,
    });
    return response.data;
  },

  updateStatus: async (materialId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Material> => {
    const response = await apiInstance.put<Material>(`/materials/${materialId}/status`, { status });
    return response.data;
  },

  deleteMaterial: async (materialId: string): Promise<void> => {
    await apiInstance.delete(`/materials/${materialId}`);
  },
};

export default materialsApi;
