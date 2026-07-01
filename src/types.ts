export interface Detection {
  class: 'pothole' | 'linear crack' | 'alligator crack';
  confidence: number;
  image_index?: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Report {
  id: number;
  kodeUnik?: string;
  email: string;
  createdAt: string | Date;
  latitude: number;
  longitude: number;
  address?: string;
  imageUrl: string;
  deskripsi?: string;
  rdsScore: number;
  status: 'pending' | 'reviewed' | 'diteruskan';
  detections?: Detection[];
}
