import { ImageItem } from "./ImageItem";
import { Note } from "./Note";

export type UserItem = {
  userId: string;
  userName: string;
  isShowingAllItems: boolean;
  hiddenItemsCount: number;
  notes: Note[];
  imageItems: ImageItem[];
  hiddenItemsPreview: ImageItem;
};
