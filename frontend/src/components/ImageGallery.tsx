import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Note } from "../types/Note";
import { UserItems } from "../types/UserItem";

const pickRelevantImages = (imageItems: ImageItem[]) => {
  const arrayLength = imageItems.length;
  const numToShow = 9;

  const interval = arrayLength / numToShow;
  const result: ImageItem[] = [];

  for (let i = 0; i < numToShow; i++) {
    const index = Math.floor(i * interval);
    result.push(imageItems[index]);
  }

  return result;
};

const ImageGallery: React.FC<{
  onDeleteImage: (imageItem: ImageItem) => void;
  ownedImageItems: ImageItem[];
  othersImageItems: ImageItem[];
  ownedNotes: Note[];
  othersNotes: Note[];
  groupedItems: UserItems[];
  userNames: { [id: string]: string };
  onImageClick: (imageItem: ImageItem) => void;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
}> = memo(
  ({
    onDeleteImage,
    ownedImageItems,
    ownedNotes,
    groupedItems,
    onImageClick,
    onNoteClick,
    onDeleteNote,
  }) => {
    const [editMode, setEditMode] = useState<boolean>(false);
    const [usersShowAll, setUsersShowAll] = useState<Set<string>>(new Set());

    const showAllForUser = (userId: string) => {
      const newSet = new Set(usersShowAll);
      newSet.add(userId);
      setUsersShowAll(newSet);
    };

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
                <button className="button" onClick={() => setEditMode(true)}>
                  Edit
                </button>
              )}
              {editMode && (
                <button className="button" onClick={() => setEditMode(false)}>
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
                  key={"all-photos-title"}
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
                  {(usersShowAll.has(userItems.userId)
                    ? userItems.imageItems
                    : pickRelevantImages(userItems.imageItems)
                  ).map((imageItem, index) => (
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
                  {!usersShowAll.has(userItems.userId) &&
                    userItems.imageItems.length > 9 && (
                      <motion.li
                        layout
                        className="cursor-pointer w-28 image-gallery-show-more"
                        key={"show-more"}
                        onClick={() => showAllForUser(userItems.userId)}
                      >
                        <img
                          src={userItems.imageItems[9].thumbnail.url}
                          alt={userItems.imageItems[9].name}
                          width={userItems.imageItems[9].thumbnail.width}
                          height={userItems.imageItems[9].thumbnail.height}
                        />
                        <span className="bg-black/80 absolute w-full h-full flex items-center justify-center font-semibold text-primary">
                          +{userItems.imageItems.length - 9}
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
