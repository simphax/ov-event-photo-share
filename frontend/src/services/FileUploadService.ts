import { AxiosResponse } from "axios";
import http from "../http-common";
import { getUserId } from "./UserService";

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const upload = async (file: File, abortSignal: AbortSignal, onUploadProgress: (progressEvent: any) => void): Promise<AxiosResponse> => {
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

  const request: Promise<AxiosResponse> = http.post("/gallery", formData, config);

  return request;
};

const deleteFile = (id: string): Promise<any> => {
  return http.delete(`/gallery/${encodeURIComponent(id)}`);
};

const getFiles = (): Promise<any> => {
  return http.get("/gallery");
};

const FileUploadService = {
  upload,
  deleteFile,
  getFiles,
};

export default FileUploadService;
