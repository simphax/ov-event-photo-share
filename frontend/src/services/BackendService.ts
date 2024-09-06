import http from "../http-common";
import { getUserId } from "./UserService";
import { ImageItemResponseModel } from "../../../common/types/ImageItemResponseModel";
import { NoteResponseModel } from "../../../common/types/NoteResponseModel";
import { NoteCreateRequestModel } from "../../../common/types/NoteCreateRequestModel";
import { UserResponseModel } from "../../../common/types/UserResponseModel";
import { GalleryCountResponseModel } from "@common/types/GalleryCountResponseModel";
import { clear } from "console";

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

const getUsers = async (): Promise<UserResponseModel[]> => {
  const response = await http.get("/users");
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

const setUserName = (id: string, name: string): Promise<any> => {
  return http.put(`/users/${encodeURIComponent(id)}`, { name });
};

const runGalleryCountPolling = (onUpdate: (count: number) => void) => {
  const makeRequest = async () => {
    try {
      const response = await http.get<GalleryCountResponseModel>(
        "/gallery/count",
        { timeout: 5000 }
      );
      const data = response.data;
      onUpdate(data.count);
    } catch (error) {
      console.error("Failed to get gallery count", error);
    } finally {
      setTimeout(makeRequest, 2000); // Schedule the next request after 2 seconds
    }
  };

  setTimeout(makeRequest, 0); // Start the initial request immediately
};

const runGalleryCountStream = (onUpdate: (count: number) => void) => {
  const evtSource = new EventSource(
    `${process.env.REACT_APP_API_URL}gallery/count-stream`
  );
  evtSource.onmessage = (event) => {
    if (event.data) {
      const countData: GalleryCountResponseModel = JSON.parse(event.data);
      onUpdate(countData.count);
    }
  };
};

export const BackendService = {
  uploadImageItem,
  deleteImageItem,
  getImageItems,

  getNotes,
  addNote,
  deleteNote,
  setUserName,

  getUsers,

  runGalleryCountPolling,
  runGalleryCountStream,
};
