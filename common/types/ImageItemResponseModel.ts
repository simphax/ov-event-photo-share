export type MediaType = "image" | "video";

export type ImageItemResponseModel = {
  id: string;
  type?: MediaType;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
  image: {
    url: string;
    width: number;
    height: number;
  };
  user: string;
  name: string;
  uploadedDateTime: string;
  duration?: number; // Video duration in seconds
};
