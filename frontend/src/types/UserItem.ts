import { ImageItem } from "./ImageItem";
import { Note } from "./Note";

export type UserItems = {
  userId: string;
  userName: string;
  notes: Note[];
  imageItems: ImageItem[];
};
