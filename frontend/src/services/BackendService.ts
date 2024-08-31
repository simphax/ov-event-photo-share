import { AxiosResponse } from "axios";
import http from "../http-common";
import { getUserId } from "./UserService";
import { ImageItemResponseModel } from "../types/ImageItemResponseModel";
import { NoteResponseModel } from "../types/NoteResponseModel";

const uploadImageItem = async (
  file: File,
  abortSignal: AbortSignal,
  onUploadProgress: (progressEvent: any) => void
): Promise<AxiosResponse> => {
  let formData = new FormData();

  formData.append("file", file);
  formData.append("user", getUserId());

  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
    signal: abortSignal,
  };

  const request: Promise<AxiosResponse> = http.post(
    "/gallery",
    formData,
    config
  );

  return request;
};

const deleteImageItem = (id: string): Promise<any> => {
  return http.delete(`/gallery/${encodeURIComponent(id)}`);
};

const getImageItems = async (): Promise<ImageItemResponseModel[]> => {
  const response = await http.get("/gallery");
  const data = response.data;
  return data;
};

const getNotes = async (): Promise<NoteResponseModel[]> => {
  const response = await http.get("/notes");
  const data = response.data;
  return data;
};

export const BackendService = {
  uploadImageItem,
  deleteImageItem,
  getImageItems,

  getNotes,
};
