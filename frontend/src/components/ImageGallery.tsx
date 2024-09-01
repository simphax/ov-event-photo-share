import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useMemo, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Note } from "../types/Note";

type UserItems = {
  userId: string;
  userName: string;
  notes: Note[];
  imageItems: ImageItem[];
};

const ImageGallery: React.FC<{
  onDeleteImage: (imageItem: ImageItem) => void;
  ownedImageItems: ImageItem[];
  othersImageItems: ImageItem[];
  ownedNotes: Note[];
  othersNotes: Note[];
  userNames: { [id: string]: string };
  onImageClick: (imageItem: ImageItem) => void;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
}> = memo(
  ({
    onDeleteImage,
    ownedImageItems,
    othersImageItems,
    ownedNotes,
    othersNotes,
    userNames,
    onImageClick,
    onNoteClick,
    onDeleteNote,
  }) => {
    const [editMode, setEditMode] = useState<boolean>(false);

    const groupedItems: UserItems[] = useMemo(() => {
      const groupedNotes: { [key: string]: Note[] } = othersNotes.reduce(
        (acc, note) => {
          if (!acc[note.userId]) {
            acc[note.userId] = [];
          }
          acc[note.userId].push(note);
          return acc;
        },
        {} as { [key: string]: Note[] }
      );

      const groupedImageItems: { [key: string]: ImageItem[] } =
        othersImageItems.reduce((acc, imageItem) => {
          if (!acc[imageItem.userId]) {
            acc[imageItem.userId] = [];
          }
          acc[imageItem.userId].push(imageItem);
          return acc;
        }, {} as { [key: string]: ImageItem[] });

      const userIdsWithContent = new Set(
        Object.keys(groupedNotes).concat(Object.keys(groupedImageItems))
      );

      return Array.from(userIdsWithContent).map((userId) => {
        return {
          userId,
          userName: userNames[userId] || "Anonymous",
          notes: groupedNotes[userId] || [],
          imageItems: groupedImageItems[userId] || [],
        };
      });
    }, [othersNotes, othersImageItems]);

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
            <motion.ul layout key={"all-photos-list"} className="image-gallery">
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
            </motion.ul>
          </>
        ))}
      </AnimatePresence>
    );
  }
);

export default ImageGallery;
