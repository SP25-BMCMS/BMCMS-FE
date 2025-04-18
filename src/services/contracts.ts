import apiInstance from '@/lib/axios';

export interface Device {
  device_id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  buildingDetailId: string;
  contract_id: string;
}

export interface Contract {
  contract_id: string;
  start_date: string;
  end_date: string;
  vendor: string;
  file_name: string;
  createdAt: string;
  devices: Device[];
  fileUrl: string;
  viewUrl: string;
  directFileUrl: string;
}

export interface ContractsResponse {
  statusCode: number;
  message: string;
  data: Contract[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters?: {
    search?: string;
  };
}

export interface ContractResponse {
  statusCode: number;
  message: string;
  data: Contract;
}

export const getContracts = async (): Promise<ContractsResponse> => {
  try {
    const response = await apiInstance.get<ContractsResponse>(
      import.meta.env.VITE_GET_CONTRACT_LIST
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching contracts:', error);
    throw error;
  }
};

export const getContractById = async (contractId: string): Promise<ContractResponse> => {
  try {
    const url = import.meta.env.VITE_GET_CONTRACT_BY_ID.replace('{id}', contractId);
    const response = await apiInstance.get<ContractResponse>(url);
    return response.data;
  } catch (error) {
    console.error(`Error fetching contract with ID ${contractId}:`, error);
    throw error;
  }
};

// Hàm lọc contracts theo buildingDetailId
export const getContractsByBuildingDetailId = async (
  buildingDetailId: string
): Promise<Contract[]> => {
  try {
    const contractsResponse = await getContracts();

    if (!contractsResponse.data || contractsResponse.data.length === 0) {
      return [];
    }

    // Lọc contracts có chứa thiết bị với buildingDetailId tương ứng
    const matchingContracts = contractsResponse.data.filter(contract =>
      contract.devices.some(device => device.buildingDetailId === buildingDetailId)
    );

    return matchingContracts;
  } catch (error) {
    console.error(`Error filtering contracts for building detail ID ${buildingDetailId}:`, error);
    throw error;
  }
};
