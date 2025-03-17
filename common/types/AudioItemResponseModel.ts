export type AudioItemResponseModel = {
  id: string;
  user: string;
  name: string;
  uploadedDateTime: string;
  audio: {
    url: string;
    duration: number; // in seconds
    size: number; // in bytes
  };
};
