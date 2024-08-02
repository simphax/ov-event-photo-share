import { ImageItem } from "../types/ImageItem";

export function SelectImages({
  pendingImageItems,
  setPendingImageItems,
  uploadImages,
  uploadInProgress,
  oneUploadDone,
  pendingImageAngles,
  combinedProgress,
  selectImages,
}: {
  pendingImageItems: ImageItem[];
  setPendingImageItems: any; // Replace 'any' with the actual type of setPendingImageItems
  uploadImages: any; // Replace 'any' with the actual type of uploadImages
  uploadInProgress: boolean;
  oneUploadDone: boolean;
  pendingImageAngles: any; // Replace 'any' with the actual type of pendingImageAngles
  combinedProgress: any; // Replace 'any' with the actual type of combinedProgress
  selectImages: any; // Replace 'any' with the actual type of selectImages
}): JSX.Element {
  const pendingtemsWithError = pendingImageItems.filter((item) => item.error);

  if (uploadInProgress) {
    return (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.url})`,
                  "--angle": `${pendingImageAngles[index]}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="progress-images__count">
            <span className="text-sm tracking-wider font-semibold">
              {pendingImageItems.length}
            </span>
          </div>
        </div>

        <div className="progress-progress">
          <div className="progress-progress__text text-sm tracking-wider font-semibold mb-2">
            Uploading...
          </div>
          <div className="progress">
            <div
              className="progress__bar"
              role="progressbar"
              aria-valuenow={combinedProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ width: combinedProgress + "%" }}
            ></div>
          </div>
        </div>
        <div className="progress-cancel">
          <button
            className="progress-cancel__button"
            onClick={() => setPendingImageItems([])}
          >
            <div>
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
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (pendingtemsWithError.length > 0) {
    return (
      <div className="progress-container">
        <div className="progress-images">
          {pendingImageItems.slice(0, 3).map((imageItem, index) => (
            <div
              className="progress-images__image"
              key={imageItem.id}
              style={
                {
                  backgroundImage: `url(${imageItem.url})`,
                  "--angle": `${pendingImageAngles[index]}deg`,
                } as React.CSSProperties
              }
            />
          ))}
          <div className="progress-images__count">
            <span className="text-sm tracking-wider font-semibold">
              {pendingImageItems.length}
            </span>
          </div>
        </div>

        <div className="progress-progress">
          <div className="progress-progress__text text-sm tracking-wider font-semibold mb-2">
            Could not upload all pictures
          </div>
          <button
            className="progress-progress__button"
            onClick={() => uploadImages()}
          >
            Try again
          </button>
        </div>
        <div className="progress-cancel">
          <button
            className="progress-cancel__button"
            onClick={() => setPendingImageItems([])}
          >
            <div>
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
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (oneUploadDone) {
    return (
      <>
        <div className="flex align-center justify-center">
          <svg
            width="33"
            height="33"
            viewBox="0 0 33 33"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                d="M12.3752 22.2338L6.64146 16.5L4.68896 18.4388L12.3752 26.125L28.8752 9.62503L26.9365 7.68628L12.3752 22.2338Z"
                fill="#DDD2C0"
              />
            </g>
          </svg>
        </div>
        <p className="text-center">
          Thank you so much, you are so appreciated!
        </p>

        <div className="py-6">
          <label className="bg-primary p-4 rounded-full text-primaryText relative overflow-hidden block text-center tracking-wider font-semibold">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={selectImages}
              className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
            />
            Upload more
          </label>
        </div>
      </>
    );
  }

  return (
    <div className="pt-6">
      <label className="bg-primary p-4 rounded-full text-primaryText relative overflow-hidden block text-center tracking-wider font-semibold">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={selectImages}
          className="cursor-pointer absolute inset-0 w-full h-full opacity-0"
        />
        Choose photos to share
      </label>
    </div>
  );
}
