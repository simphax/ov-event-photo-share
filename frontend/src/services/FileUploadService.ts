import http from "../http-common";
import { getUserId } from "./UserService";

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const upload = async (file: File, onUploadProgress: (progressEvent: any) => void): Promise<any> => {
  let formData = new FormData();

  formData.append("file", file);
  formData.append("user", getUserId());

  return http.post("/gallery", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
  });
};

const deleteFile = (id: string): Promise<any> => {
  return http.delete(`/gallery/${encodeURIComponent(id)}`);
};

const getFiles = () : Promise<any> => {
  return http.get("/gallery");
};

const FileUploadService = {
  upload,
  deleteFile,
  getFiles,
};

export default FileUploadService;
