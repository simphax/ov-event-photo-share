export type AudioItem = {
  id: string;
  remoteId?: string;
  file?: File;
  audio?: {
    url: string;
    duration?: number;
    size?: number;
  };
  userId: string;
  name: string;
  uploadedDateTime: Date;
  uploadProgress: number;
  uploadDone: boolean;
  error: boolean;
  loadingDelete: boolean;
};