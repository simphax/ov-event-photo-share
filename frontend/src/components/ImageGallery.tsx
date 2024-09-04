import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { Note } from "../types/Note";
import { UserItem } from "../types/UserItem";
import { UserItemsGrid } from "./UserItemsGrid";
import { getUserId } from "../services/UserService";

const brideGroomUserId = "simonclara";

const ImageGallery: React.FC<{
  groupedItems: UserItem[];
  onDeleteImage: (imageItem: ImageItem) => void;
  onImageClick: (imageItem: ImageItem) => void;
  onNoteClick: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onShowAll: (userId: string) => void;
  onShowLess: (userId: string) => void;
}> = memo(
  ({
    onDeleteImage,
    groupedItems,
    onImageClick,
    onNoteClick,
    onDeleteNote,
    onShowAll,
    onShowLess,
  }) => {
    const [editMode, setEditMode] = useState<boolean>(false);

    const myItems = groupedItems.find((item) => item.userId === getUserId());
    const brideGroomItems = groupedItems.find(
      (item) => item.userId === brideGroomUserId
    );
    const othersItems = groupedItems.filter(
      (item) => item.userId !== getUserId() && item.userId !== brideGroomUserId
    );

    return (
      <AnimatePresence>
        {(myItems?.imageItems.length || myItems?.notes.length) && (
          <div key="my-photos-section" className="mb-12">
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
                  onClick={() => {
                    setEditMode(true);
                    onShowAll(myItems.userId);
                  }}
                >
                  Edit
                </button>
              )}
              {editMode && (
                <button
                  className="button text-primary bg-primary/10"
                  onClick={() => {
                    setEditMode(false);
                    onShowLess(myItems.userId);
                  }}
                >
                  Done
                </button>
              )}
            </div>

            <UserItemsGrid
              userItem={myItems}
              hideUploadedBy
              onImageClick={onImageClick}
              onNoteClick={onNoteClick}
              onShowAll={onShowAll}
              onShowLess={onShowLess}
              renderNoteControls={(note: Note) =>
                editMode && (
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
                )
              }
              renderImageControls={(imageItem: ImageItem) =>
                editMode && (
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
                )
              }
            />
          </div>
        )}

        {(brideGroomItems?.imageItems.length ||
          brideGroomItems?.notes.length) && (
          <div key="bride-groom-section" className="mb-12">
            <h2
              key={"bride-groom-title"}
              className="text-sm my-4 font-semibold tracking-wider"
            >
              From the Bride and Groom
            </h2>
                <UserItemsGrid
                  hideUploadedBy
                  userItem={brideGroomItems}
                  onImageClick={onImageClick}
                  onNoteClick={onNoteClick}
                  onShowAll={onShowAll}
                  onShowLess={onShowLess}
                />
          </div>
        )}

        {othersItems.length > 0 && (
          <div key="all-photos-section">
            <h2
              key={"all-photos-title"}
              className="text-sm mt-4 font-semibold tracking-wider"
            >
              Guests photos
            </h2>
            {othersItems.map((userItem, index) => (
              <div
                key={userItem.userId}
                className={`relative ${index !== 0 ? "mt-8" : ""}`}
              >
                <UserItemsGrid
                  userItem={userItem}
                  onImageClick={onImageClick}
                  onNoteClick={onNoteClick}
                  onShowAll={onShowAll}
                  onShowLess={onShowLess}
                />
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    );
  }
);

export default ImageGallery;
