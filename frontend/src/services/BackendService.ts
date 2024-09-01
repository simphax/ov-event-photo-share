import http from "../http-common";
import { getUserId } from "./UserService";
import { ImageItemResponseModel } from "../../../common/types/ImageItemResponseModel";
import { NoteResponseModel } from "../../../common/types/NoteResponseModel";
import { NoteCreateRequestModel } from "../../../common/types/NoteCreateRequestModel";

const uploadImageItem = async (
  file: File,
  abortSignal: AbortSignal,
  onUploadProgress: (progressEvent: any) => void
): Promise<ImageItemResponseModel> => {
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

  const response = await http.post("/gallery", formData, config);

  return response.data;
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

const addNote = async (
  note: string,
  userName: string
): Promise<NoteResponseModel> => {
  const noteCreateModel: NoteCreateRequestModel = {
    userId: getUserId(),
    userName,
    content: note,
  };
  const response = await http.post("/notes", noteCreateModel);
  return response.data;
};

const deleteNote = (id: string): Promise<any> => {
  return http.delete(`/notes/${encodeURIComponent(id)}`);
};

export const BackendService = {
  uploadImageItem,
  deleteImageItem,
  getImageItems,

  getNotes,
  addNote,
  deleteNote,
};
