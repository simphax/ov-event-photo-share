import { motion } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { Note } from "../types/Note";
import { UserItem } from "../types/UserItem";
import { ChevronUp } from "lucide-react";
import { memo } from "react";
import { maxItemsBeforeShowMore } from "./constants";
import { getUserId } from "../services/UserService";

type UserItemsGridProps = {
  userItem: UserItem;
  hideUploadedBy?: boolean;
  onNoteClick: (note: Note) => void;
  onImageClick: (imageItem: ImageItem) => void;
  onShowAll: (userId: string) => void;
  onShowLess: (userId: string) => void;
  renderNoteControls?: (note: Note) => React.ReactNode;
  renderImageControls?: (imageItem: ImageItem) => React.ReactNode;
};

export const UserItemsGrid: React.FC<UserItemsGridProps> = memo(
  ({
    userItem,
    hideUploadedBy,
    onNoteClick,
    onImageClick,
    onShowAll,
    onShowLess,
    renderNoteControls,
    renderImageControls,
  }) => {
    return (
      <>
        {!hideUploadedBy && (
          <h2
            key={"uploaded-by-title"}
            className={`text-xs mb-3 tracking-wider text-primaryText/60 text-left`}
          >
            Uploaded by: {userItem.userName}{" "}
            {userItem.userId === getUserId() && (
              <span className="inline-block ml-3 bg-primary/100 text-primaryText rounded px-1 py-[2px] font-semibold">
                You!
              </span>
            )}
          </h2>
        )}
        <motion.ul layout key={"all-photos-list"} className="image-gallery">
          {userItem.notes.map((note, index) => (
            <motion.li
              layout
              className={`cursor-pointer image-gallery-note`}
              key={note.id}
              onClick={() => onNoteClick(note)}
            >
              <span className="image-gallery-note__note">{note.content}</span>
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="underline whitespace-nowrap mr-2">
                  Read more
                </div>
                <div className="truncate">{note.userName}</div>
              </div>
              {renderNoteControls?.(note)}
            </motion.li>
          ))}
          {userItem.imageItems.map((imageItem, index) => (
            <motion.li
              layout
              className={`cursor-pointer image-gallery-image`}
              key={imageItem.id}
              style={{
                flexGrow: imageItem.thumbnail.width,
                width:
                  ((imageItem.thumbnail.width || 1) /
                    (imageItem.thumbnail.height || 1)) *
                    100 +
                  "px",
              }}
              onClick={() => onImageClick(imageItem)}
            >
              <img
                src={imageItem.thumbnail.url}
                alt={imageItem.name}
                width={imageItem.thumbnail.width}
                height={imageItem.thumbnail.height}
              />
              {renderImageControls?.(imageItem)}
            </motion.li>
          ))}
          {!userItem.isShowingAllItems && (
            <motion.li
              layout
              className="cursor-pointer w-28 image-gallery-show-more"
              key={"show-more"}
              onClick={() => onShowAll(userItem.userId)}
            >
              <img
                src={userItem.hiddenItemsPreview.thumbnail.url}
                alt={userItem.hiddenItemsPreview.name}
                width={userItem.hiddenItemsPreview.thumbnail.width}
                height={userItem.hiddenItemsPreview.thumbnail.height}
              />
              <span className="bg-black/80 absolute w-full h-full flex items-center justify-center font-semibold text-primary">
                +{userItem.hiddenItemsCount}
              </span>
            </motion.li>
          )}
        </motion.ul>
        {userItem.isShowingAllItems &&
          userItem.imageItems.length > maxItemsBeforeShowMore && (
            <motion.div
              layout
              className="cursor-pointer mt-4 relative image-gallery-show-more w-full rounded-lg h-7 bg-black/20 flex items-center justify-center text-sm font-semibold text-primary"
              key={"show-less"}
              onClick={() => onShowLess(userItem.userId)}
            >
              <div className="w-full flex items-center justify-center">
                <ChevronUp className="mr-2" /> Show less
              </div>
            </motion.div>
          )}
      </>
    );
  }
);
