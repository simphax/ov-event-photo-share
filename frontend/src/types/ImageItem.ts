export type ImageItem = {
  thumbnail: {
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
};
