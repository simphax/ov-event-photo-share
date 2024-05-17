import { motion, AnimatePresence } from "framer-motion";
import { ImageItem } from "../types/ImageItem";
import React from "react";

const ImageGallery: React.FC<{
    onDeleteImage: (imageItem: ImageItem) => void;
  uploadedImageItems: ImageItem[];
  downloadedImageItems: ImageItem[];
}> = React.memo(({ onDeleteImage, uploadedImageItems, downloadedImageItems }) => {
  return (
    <AnimatePresence>
      {!!uploadedImageItems.length && (
        <h2 key={"my-photos-title"} className="text-sm my-4 font-semibold tracking-wider">My photos</h2>
      )}
      <motion.ul layout key={"my-photos-list"} className="image-gallery">
        {uploadedImageItems.map((imageItem, index) => {
          return (
            <motion.li
              layout
              key={imageItem.id}
              className={`image-gallery__item${
                imageItem.uploadDone ? " image-gallery__item--success" : ""
              }${imageItem.error ? " image-gallery__item--error" : ""}`}
              onClick={() => onDeleteImage(imageItem)}
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
            </motion.li>
          );
        })}
      </motion.ul>
      <h2 key={"all-photos-title"} className="text-sm my-4 font-semibold tracking-wider">All photos</h2>
      <motion.ul layout key={"all-photos-list"} className="image-gallery">
        {downloadedImageItems.map((imageItem, index) => (
          <motion.li
            layout
            className={`image-gallery__item`}
            onClick={() => onDeleteImage(imageItem)}
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
