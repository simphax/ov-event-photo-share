import { ImageItem } from "./ImageItem";
import { AudioItem } from "./AudioItem";
import { Note } from "./Note";

export type UserItem = {
  userId: string;
  userName: string;
  isShowingAllItems: boolean;
  hiddenItemsCount: number;
  notes: Note[];
  imageItems: ImageItem[];
  audioItems?: AudioItem[];
  hiddenItemsPreview: ImageItem;
};
