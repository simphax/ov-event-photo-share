import http from "../http-common";

const upload = (file: File, onUploadProgress: (progressEvent: any) => void): Promise<any> => {
  let formData = new FormData();

  formData.append("file", file);

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
