import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import { memo, useState } from "react";

const ImageGallery: React.FC<{
  onDeleteImage: (imageItem: ImageItem) => void;
  uploadedImageItems: ImageItem[];
  downloadedImageItems: ImageItem[];
}> = memo(({ onDeleteImage, uploadedImageItems, downloadedImageItems }) => {
  const [editMode, setEditMode] = useState<boolean>(false);
  console.log("ImageGallery render", uploadedImageItems);
  return (
    <AnimatePresence>
      {!!uploadedImageItems.length && (
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
            {uploadedImageItems.map((imageItem, index) => {
              return (
                <motion.li
                  layout
                  key={imageItem.id}
                  className={`image-gallery__item${
                    imageItem.uploadDone ? " image-gallery__item--success" : ""
                  }${imageItem.error ? " image-gallery__item--error" : ""}`}
                  style={{
                    flexGrow: imageItem.width,
                    width:
                      ((imageItem.width || 1) / (imageItem.height || 1)) * 100 +
                      "px",
                  }}
                >
                  <img
                    src={imageItem.url}
                    alt={imageItem.name}
                    width={imageItem.width}
                    height={imageItem.height}
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
                        <svg
                          className="animate-spin"
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
                          <line x1="12" y1="2" x2="12" y2="6"></line>
                          <line x1="12" y1="18" x2="12" y2="22"></line>
                          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                          <line
                            x1="16.24"
                            y1="16.24"
                            x2="19.07"
                            y2="19.07"
                          ></line>
                          <line x1="2" y1="12" x2="6" y2="12"></line>
                          <line x1="18" y1="12" x2="22" y2="12"></line>
                          <line
                            x1="4.93"
                            y1="19.07"
                            x2="7.76"
                            y2="16.24"
                          ></line>
                          <line
                            x1="16.24"
                            y1="7.76"
                            x2="19.07"
                            y2="4.93"
                          ></line>
                        </svg>
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
        {downloadedImageItems.map((imageItem, index) => (
          <motion.li
            layout
            className={`image-gallery__item`}
            key={imageItem.id}
            style={{
              flexGrow: imageItem.width,
              width:
                ((imageItem.width || 1) / (imageItem.height || 1)) * 100 + "px",
            }}
          >
            <img
              src={imageItem.url}
              alt={imageItem.name}
              width={imageItem.width}
              height={imageItem.height}
            />
          </motion.li>
        ))}
      </motion.ul>
    </AnimatePresence>
  );
});

export default ImageGallery;
