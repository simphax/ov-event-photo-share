export type MediaType = "image" | "video";
export type ProcessingStatus = "processing" | "ready" | "error";

export type ImageItem = {
  type?: MediaType;
  status?: ProcessingStatus;
  thumbnail?: {
    url: string;
    width?: number;
    height?: number;
  };
  image?: {
    url: string;
    width?: number;
    height?: number;
  };
  id: string;
  userId: string;
  name: string;
  uploadedDateTime: Date;
  uploadProgress: number;
  uploadDone: boolean;
  loadingDelete: boolean;
  error: any;
  remoteId?: string;
  file?: File;
  duration?: number; // Video duration in seconds
};
