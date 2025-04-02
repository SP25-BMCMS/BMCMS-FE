import { Crack } from "@/types";

export const mockCracks: Crack[] = [
    {
      id: "CRK001",
      reportDescription: "Wall crack in living room, approximately 30cm long",
      createdDate: "15/01/2025",
      status: "pending",
      residentId: "123123",
      residentName: "Nguyễn Tấn Lộc",
      location: "VinHomes s102.3xxx",
      description: "A wall crack is a visible line or split on the surface of a wall, often caused by structural movement, settling, or external stress. It can vary in size, from fine hairline cracks to larger, more noticeable gaps, and may affect the wall's appearance and stability.",
      originalImage: "https://via.placeholder.com/400x300?text=Original+Crack+1",
      originalImage2: "https://via.placeholder.com/400x300?text=Original+Crack+2",
      aiDetectedImage: "https://via.placeholder.com/400x300?text=AI+Detected+Crack+1",
      aiDetectedImage2: "https://via.placeholder.com/400x300?text=AI+Detected+Crack+2"
    },
    {
      id: "CRK002",
      reportDescription: "Ceiling crack with water leakage in bathroom",
      createdDate: "22/01/2025",
      status: "InProgress",
      residentId: "123111",
      residentName: "Duong Quang Huy",
      location: "VinHomes s104.8xxx",
      description: "A ceiling crack with water leakage indicates potential water damage from plumbing issues or roof leaks. The crack appears to be allowing water to seep through, which could lead to further structural damage, mold growth, and deterioration if not addressed promptly.",
      originalImage: "https://via.placeholder.com/400x300?text=Original+Crack+3",
      aiDetectedImage: "https://via.placeholder.com/400x300?text=AI+Detected+Crack+3"
    },
    // Add other cracks with complete data
  ];