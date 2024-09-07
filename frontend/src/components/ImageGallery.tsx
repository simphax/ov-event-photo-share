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
    const brideGroomItems = groupedItems.find(
      (item) => item.userId === brideGroomUserId
    );
    const othersItems = groupedItems.filter(
      (item) => item.userId !== brideGroomUserId
    );

    return (
      <div className="px-4">
        <AnimatePresence>
          {othersItems.length > 0 && (
            <div key="all-photos-section">
              {othersItems.map((userItem, index) => (
                <div
                  key={userItem.userId}
                  className={`relative ${index !== 0 ? "mt-8" : "mt-4"}`}
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

          {(brideGroomItems?.imageItems.length ||
            brideGroomItems?.notes.length) && (
            <div key="bride-groom-section" className="mt-12">
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
        </AnimatePresence>
      </div>
    );
  }
);

export default ImageGallery;
