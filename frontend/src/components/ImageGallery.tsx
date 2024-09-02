import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Note } from "../types/Note";
import { UserItem } from "../types/UserItem";
import { ChevronUp } from "lucide-react";

const ImageGallery: React.FC<{
  onDeleteImage: (imageItem: ImageItem) => void;
  ownedImageItems: ImageItem[];
  othersImageItems: ImageItem[];
  ownedNotes: Note[];
  othersNotes: Note[];
  groupedItems: UserItem[];
  onImageClick: (imageItem: ImageItem) => void;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onShowAll: (userId: string) => void;
  onShowLess: (userId: string) => void;
}> = memo(
  ({
    onDeleteImage,
    ownedImageItems,
    ownedNotes,
    groupedItems,
    onImageClick,
    onNoteClick,
    onDeleteNote,
    onShowAll,
    onShowLess,
  }) => {
    const [editMode, setEditMode] = useState<boolean>(false);

    return (
      <AnimatePresence>
        {!!ownedImageItems.length && (
          <div className="mb-12">
            <div className="flex items-center justify-between">
              <h2
                key={"my-photos-title"}
                className="text-sm my-4 font-semibold tracking-wider"
              >
                My photos
              </h2>
              {!editMode && (
                <button
                  className="button text-primary bg-primary/10"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              )}
              {editMode && (
                <button
                  className="button text-primary bg-primary/10"
                  onClick={() => setEditMode(false)}
                >
                  Done
                </button>
              )}
            </div>
            <motion.ul layout key={"my-photos-list"} className="image-gallery">
              {ownedNotes.map((note, index) => (
                <motion.li
                  layout
                  className={`cursor-pointer image-gallery-note`}
                  key={note.id}
                  onClick={() => onNoteClick(note)}
                >
                  <span className="image-gallery-note__note">
                    {note.content}
                  </span>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="underline whitespace-nowrap mr-2">
                      Read more
                    </div>
                    <div className="truncate">/{note.userName}</div>
                  </div>
                  {editMode && (
                    <button
                      className="button-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note);
                      }}
                      disabled={note.loadingDelete}
                    >
                      {note.loadingDelete ? (
                        <LoadingSpinner />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      )}
                    </button>
                  )}
                </motion.li>
              ))}
              {ownedImageItems.map((imageItem, index) => {
                return (
                  <motion.li
                    layout
                    key={imageItem.id}
                    className={`cursor-pointer image-gallery__item${
                      imageItem.uploadDone
                        ? " image-gallery__item--success"
                        : ""
                    }${imageItem.error ? " image-gallery__item--error" : ""}`}
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
                    {editMode && (
                      <button
                        className="button-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteImage(imageItem);
                        }}
                        disabled={imageItem.loadingDelete}
                      >
                        {imageItem.loadingDelete ? (
                          <LoadingSpinner />
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        )}
                      </button>
                    )}
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>
        )}

        {groupedItems.length > 0 && (
          <>
            <h2
              key={"all-photos-title"}
              className="text-sm mt-4 font-semibold tracking-wider"
            >
              All photos
            </h2>
            {groupedItems.map((userItems, index) => (
              <>
                <h2
                  key={"uploaded-by-title"}
                  className={`text-xs mb-3${
                    index === 0 ? "" : " mt-8"
                  } tracking-wider text-primary/40 text-right`}
                >
                  Uploaded by: {userItems.userName}
                </h2>
                <motion.ul
                  layout
                  key={"all-photos-list"}
                  className="image-gallery"
                >
                  {userItems.notes.map((note, index) => (
                    <motion.li
                      layout
                      className={`cursor-pointer image-gallery-note`}
                      key={note.id}
                      onClick={() => onNoteClick(note)}
                    >
                      <span className="image-gallery-note__note">
                        {note.content}
                      </span>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="underline whitespace-nowrap mr-2">
                          Read more
                        </div>
                        <div className="truncate">{note.userName}</div>
                      </div>
                    </motion.li>
                  ))}
                  {userItems.imageItems.map((imageItem, index) => (
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
                    </motion.li>
                  ))}
                  {!userItems.isShowingAllItems && (
                    <motion.li
                      layout
                      className="cursor-pointer w-28 image-gallery-show-more"
                      key={"show-more"}
                      onClick={() => onShowAll(userItems.userId)}
                    >
                      <img
                        src={userItems.hiddenItemsPreview.thumbnail.url}
                        alt={userItems.hiddenItemsPreview.name}
                        width={userItems.hiddenItemsPreview.thumbnail.width}
                        height={userItems.hiddenItemsPreview.thumbnail.height}
                      />
                      <span className="bg-black/80 absolute w-full h-full flex items-center justify-center font-semibold text-primary">
                        +{userItems.hiddenItemsCount}
                      </span>
                    </motion.li>
                  )}
                  {userItems.isShowingAllItems &&
                    userItems.imageItems.length > 9 && (
                      <motion.li
                        layout
                        className="cursor-pointer image-gallery-show-more w-full !h-7"
                        key={"show-less"}
                        onClick={() => onShowLess(userItems.userId)}
                      >
                        <span className="bg-black/20 absolute w-full h-full flex items-center justify-center text-sm font-semibold text-primary">
                          <ChevronUp className="mr-2" /> Show less
                        </span>
                      </motion.li>
                    )}
                </motion.ul>
              </>
            ))}
          </>
        )}
      </AnimatePresence>
    );
  }
);

export default ImageGallery;
