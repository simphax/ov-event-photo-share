import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Note } from "../types/Note";

const ImageGallery: React.FC<{
  onDeleteImage: (imageItem: ImageItem) => void;
  ownedImageItems: ImageItem[];
  othersImageItems: ImageItem[];
  ownedNotes: Note[];
  othersNotes: Note[];
  onImageClick: (imageItem: ImageItem) => void;
  onNoteClick: (note: Note) => void;
}> = memo(
  ({
    onDeleteImage,
    ownedImageItems,
    othersImageItems,
    ownedNotes,
    othersNotes,
    onImageClick,
    onNoteClick,
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
          className="text-sm my-4 font-semibold tracking-wider"
        >
          All photos
        </h2>
        <motion.ul layout key={"all-photos-list"} className="image-gallery">
          {othersNotes.map((note, index) => (
            <motion.li
              layout
              className={`cursor-pointer image-gallery-note`}
              key={note.id}
              onClick={() => onNoteClick(note)}
            >
              <span className="image-gallery-note__note">{note.content}</span>
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="underline">Read more</div>
              </div>
            </motion.li>
          ))}
          {othersImageItems.map((imageItem, index) => (
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
      </AnimatePresence>
    );
  }
);

export default ImageGallery;
