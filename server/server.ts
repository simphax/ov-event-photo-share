import express, { Request, Response, Express } from "express";
import cors from "cors";
import multer, { FileFilterCallback } from "multer";
import { promises as fs } from "graceful-fs";
import path from "path";
import sharp from "sharp";
import { Server, createServer } from "https";
import { Sequelize, Model, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { NoteResponseModel } from "../common/types/NoteResponseModel";
import { NoteCreateRequestModel } from "../common/types/NoteCreateRequestModel";
import { constants } from "fs/promises";
import { GalleryCountResponseModel } from "../common/types/GalleryCountResponseModel";
import { ErrorResponseModel } from "../common/types/ErrorResponseModel";
import { ImageItemResponseModel } from "../common/types/ImageItemResponseModel";
import ffmpeg, { FfprobeData, FfprobeStream } from "fluent-ffmpeg";
// @ts-ignore - no types for @ffmpeg-installer/ffmpeg
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
// @ts-ignore - no types for @ffprobe-installer/ffprobe
import ffprobeInstaller from "@ffprobe-installer/ffprobe";
import PQueue from "p-queue";

// Set FFmpeg and FFprobe paths from installers
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

// Video configuration
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime", // .mov
  "video/x-msvideo", // .avi
  "video/webm",
  "video/x-matroska", // .mkv
];
const MAX_VIDEO_DURATION_SECONDS = 60; // 1 minute
const MAX_VIDEO_SIZE_MB = 600;

// Helper to check if file is video
const isVideoFile = (mimetype: string): boolean => {
  return ALLOWED_VIDEO_TYPES.includes(mimetype) || mimetype.startsWith("video/");
};

// Get file extension from mimetype
const getFileExtension = (mimetype: string, originalname?: string): string => {
  // Try to get extension from original filename first
  if (originalname) {
    const ext = path.extname(originalname).toLowerCase();
    if (ext) return ext;
  }

  // Fallback to mimetype mapping
  const mimeToExt: { [key: string]: string } = {
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/x-msvideo": ".avi",
    "video/webm": ".webm",
    "video/x-matroska": ".mkv",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };

  return mimeToExt[mimetype] || (mimetype.startsWith("video/") ? ".mp4" : ".jpg");
};

// Get video metadata (duration, dimensions)
const getVideoMetadata = (
  filePath: string
): Promise<{ duration: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: Error | null, metadata: FfprobeData) => {
      if (err) {
        reject(err);
        return;
      }
      const videoStream = metadata.streams.find(
        (s: FfprobeStream) => s.codec_type === "video"
      );
      resolve({
        duration: metadata.format.duration || 0,
        width: videoStream?.width || 0,
        height: videoStream?.height || 0,
      });
    });
  });
};

const TMP_UPLOAD_FOLDER_PATH =
  process.env.TMP_UPLOAD_FOLDER_PATH || "uploads/tmp/";
const UPLOAD_FOLDER_PATH = process.env.UPLOAD_FOLDER_PATH || "uploads/";
const METADATA_FOLDER_PATH = process.env.METADATA_FOLDER_PATH || "metadata/";
const NOTES_FOLDER_PATH = process.env.NOTES_FOLDER_PATH || "notes/";
const THUMBNAILS_FOLDER_PATH =
  process.env.THUMBNAILS_FOLDER_PATH || "thumbnails/";
const GALLERY_FOLDER_PATH = process.env.GALLERY_FOLDER_PATH || "gallery/";
const SERVER_PORT = process.env.SERVER_PORT || 5050;
const SERVER_URL = process.env.SERVER_URL || "http://89.233.211.170:5050";
const SERVER_BASE_PATH = process.env.SERVER_BASE_PATH || "/";
const SSL_PRIVATE_KEY_PATH = process.env.SSL_PRIVATE_KEY_PATH || false;
const SSL_CERTIFICATE_PATH = process.env.SSL_CERTIFICATE_PATH || false;

const corsOptions: cors.CorsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

// Processing queue for async media processing (1 item at a time to prevent CPU overload)
const processingQueue = new PQueue({ concurrency: 1 });

const startServer = async () => {
  sharp.cache(false);

  const app = express();

  let server: Server | Express;

  if (SSL_PRIVATE_KEY_PATH && SSL_CERTIFICATE_PATH) {
    const privateKey = await fs.readFile(SSL_PRIVATE_KEY_PATH, "utf8");
    const certificate = await fs.readFile(SSL_CERTIFICATE_PATH, "utf8");

    const credentials = { key: privateKey, cert: certificate };

    server = createServer(credentials, app);

    const ensureHttps = (req: Request, res: Response, next: () => void) => {
      if (req.secure) {
        return next();
      }
      res.redirect(301, "https://" + req.hostname + req.originalUrl);
    };

    app.use(ensureHttps);
  } else {
    server = app;
  }

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors(corsOptions));
  const router = express.Router();

  const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "./database.sqlite",
  });

  class User extends Model {
    declare id: string;
    declare name: string;
  }
  User.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
      },
    },
    { sequelize, modelName: "user" }
  );

  (async () => {
    await sequelize.sync();
  })();

  const fileFilter = (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else if (isVideoFile(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  };

  const upload = multer({
    dest: TMP_UPLOAD_FOLDER_PATH,
    fileFilter,
    limits: {
      fileSize: MAX_VIDEO_SIZE_MB * 1024 * 1024, // 100MB
    },
  });

  const createThumbnail = async (filePath: string) => {
    const filename = path.basename(filePath, path.extname(filePath)); // Remove extension
    const sharpFile = await sharp(filePath);
    const resizedImage = await sharpFile
      .rotate()
      .resize(200, 200, { fit: "inside" })
      .webp();

    const resizedImageBuffer = await resizedImage.toBuffer();

    const thumbnailFilePath = `${THUMBNAILS_FOLDER_PATH}/${filename}.webp`;

    await fs.writeFile(thumbnailFilePath, new Uint8Array(resizedImageBuffer));

    const thumbnailMetadata = await sharp(thumbnailFilePath).metadata();

    await fs.writeFile(
      `${THUMBNAILS_FOLDER_PATH}/${filename}.json`,
      JSON.stringify(
        {
          size: thumbnailMetadata.size,
          width: thumbnailMetadata.width,
          height: thumbnailMetadata.height,
        },
        null,
        2
      )
    );

    return {
      url: `${SERVER_URL}/gallery/${encodeURIComponent(
        filename
      )}.webp?thumbnail`,
      size: thumbnailMetadata.size,
      width: thumbnailMetadata.width,
      height: thumbnailMetadata.height,
    };
  };

  const createGalleryImage = async (filePath: string) => {
    const filename = path.basename(filePath, path.extname(filePath)); // Remove extension
    const sharpFile = await sharp(filePath);
    const resizedImage = await sharpFile
      .rotate()
      .resize(1080, 1920, { fit: "inside" })
      .jpeg();

    const resizedImageBuffer = await resizedImage.toBuffer();

    const imageFilePath = `${GALLERY_FOLDER_PATH}/${filename}.jpg`;

    await fs.writeFile(imageFilePath, new Uint8Array(resizedImageBuffer));

    const imageMetadata = await sharp(imageFilePath).metadata();

    await fs.writeFile(
      `${GALLERY_FOLDER_PATH}/${filename}.json`,
      JSON.stringify(
        {
          size: imageMetadata.size,
          width: imageMetadata.width,
          height: imageMetadata.height,
        },
        null,
        2
      )
    );

    return {
      url: `${SERVER_URL}/gallery/${encodeURIComponent(filename)}.jpg`,
      size: imageMetadata.size,
      width: imageMetadata.width,
      height: imageMetadata.height,
    };
  };

  // Create thumbnail from video by extracting a frame
  const createVideoThumbnail = async (
    filePath: string
  ): Promise<{
    url: string;
    width?: number;
    height?: number;
  }> => {
    const filename = path.basename(filePath, path.extname(filePath)); // Remove extension
    const tempPngPath = `${THUMBNAILS_FOLDER_PATH}/${filename}.png`;
    const finalWebpPath = `${THUMBNAILS_FOLDER_PATH}/${filename}.webp`;

    // Get video duration to pick a good frame
    const metadata = await getVideoMetadata(filePath);
    const timestampSeconds = Math.min(1, metadata.duration * 0.1);

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .inputOptions([
          "-ignore_unknown", // Ignore streams with unknown/unsupported codecs (like Dolby Vision layer)
        ])
        .outputOptions([
          "-map 0:v:0", // Map only the first video stream (ignores Dolby Vision enhancement layer)
          `-ss ${timestampSeconds}`, // Seek to timestamp
          "-vframes 1", // Extract one frame
          "-vf scale=400:-2", // Scale width to 400, maintain aspect (divisible by 2)
        ])
        .output(tempPngPath)
        .on("end", async () => {
          try {
            // Convert PNG to WebP using Sharp for consistency with image thumbnails
            const sharpFile = sharp(tempPngPath);
            const resizedImage = sharpFile
              .resize(200, 200, { fit: "inside" })
              .webp();

            const buffer = await resizedImage.toBuffer();
            await fs.writeFile(finalWebpPath, new Uint8Array(buffer));
            await fs.unlink(tempPngPath).catch(() => {}); // Remove temp PNG

            const thumbnailMetadata = await sharp(finalWebpPath).metadata();

            await fs.writeFile(
              `${THUMBNAILS_FOLDER_PATH}/${filename}.json`,
              JSON.stringify(
                {
                  size: thumbnailMetadata.size,
                  width: thumbnailMetadata.width,
                  height: thumbnailMetadata.height,
                },
                null,
                2
              )
            );

            resolve({
              url: `${SERVER_URL}/gallery/${encodeURIComponent(
                filename
              )}.webp?thumbnail`,
              width: thumbnailMetadata.width,
              height: thumbnailMetadata.height,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on("error", reject)
        .run();
    });
  };

  // Convert video to web-friendly H.264 MP4
  const createGalleryVideo = async (
    filePath: string
  ): Promise<{
    url: string;
    width: number;
    height: number;
    duration: number;
  }> => {
    const filename = path.basename(filePath, path.extname(filePath)); // Remove extension
    const outputPath = `${GALLERY_FOLDER_PATH}/${filename}.mp4`;

    return new Promise((resolve, reject) => {
      ffmpeg(filePath)
        .inputOptions([
          "-ignore_unknown", // Ignore streams with unknown/unsupported codecs (like Dolby Vision layer)
        ])
        .outputOptions([
          "-map 0:v:0", // Map only the first video stream (ignores Dolby Vision enhancement layer)
          "-map 0:a:0?", // Map first audio stream if it exists (optional)
          "-c:v libx264", // H.264 video codec
          "-preset fast", // Encoding speed/quality tradeoff
          "-crf 23", // Constant Rate Factor (quality)
          "-c:a aac", // AAC audio codec
          "-b:a 128k", // Audio bitrate
          "-movflags +faststart", // Web optimization
          "-vf scale=1080:-2", // Scale to 1080p width, maintain aspect (divisible by 2)
          "-max_muxing_queue_size 1024",
        ])
        .output(outputPath)
        .on("end", async () => {
          try {
            const metadata = await getVideoMetadata(outputPath);

            await fs.writeFile(
              `${GALLERY_FOLDER_PATH}/${filename}.json`,
              JSON.stringify(
                {
                  width: metadata.width,
                  height: metadata.height,
                  duration: metadata.duration,
                  type: "video",
                },
                null,
                2
              )
            );

            resolve({
              url: `${SERVER_URL}/gallery/${encodeURIComponent(filename)}.mp4`,
              width: metadata.width,
              height: metadata.height,
              duration: metadata.duration,
            });
          } catch (err) {
            reject(err);
          }
        })
        .on("error", reject)
        .run(); // Actually start the FFmpeg process
    });
  };

  const cleanupAfterError = async (fileName: string) => {
    try {
      // Try common extensions for upload folder since we now save with extensions
      const possibleExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
      const uploadFiles = possibleExtensions.map(ext =>
        path.resolve(UPLOAD_FOLDER_PATH, fileName + ext)
      );

      const filesToClean = [
        path.resolve(THUMBNAILS_FOLDER_PATH, `${fileName}.webp`),
        path.resolve(THUMBNAILS_FOLDER_PATH, `${fileName}.png`), // temp video thumbnail
        path.resolve(THUMBNAILS_FOLDER_PATH, `${fileName}.json`),
        path.resolve(GALLERY_FOLDER_PATH, `${fileName}.jpg`),
        path.resolve(GALLERY_FOLDER_PATH, `${fileName}.mp4`), // video file
        path.resolve(GALLERY_FOLDER_PATH, `${fileName}.json`),
        path.resolve(METADATA_FOLDER_PATH, `${fileName}.json`),
        ...uploadFiles,
        path.resolve(TMP_UPLOAD_FOLDER_PATH, fileName),
      ];

      await Promise.all(
        filesToClean.map((f) => fs.unlink(f).catch(() => {}))
      );
    } catch (err) {
      // Not important
      console.error("Could not cleanup", err);
    }
  };

  // Helper to update metadata status
  const updateMetadataStatus = async (
    itemId: string,
    status: "processing" | "ready" | "error"
  ) => {
    const metadataPath = `${METADATA_FOLDER_PATH}/${itemId}.json`;
    try {
      const existingContent = await fs.readFile(metadataPath, "utf8");
      const existingMetadata = JSON.parse(existingContent);
      const updatedMetadata = {
        ...existingMetadata,
        status,
      };
      await fs.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    } catch (err) {
      console.error(`Failed to update metadata for ${itemId}:`, err);
    }
  };

  // Background worker to process media items
  const processMediaItem = async (
    itemId: string,
    filePath: string,
    isVideo: boolean
  ) => {
    return processingQueue.add(async () => {
      try {
        console.log(`[Queue] Processing ${itemId}...`);

        let thumbnailMetadata;
        let mediaMetadata: {
          url: string;
          width?: number;
          height?: number;
          duration?: number;
        };

        if (isVideo) {
          console.log(`[Queue] Creating video thumbnail for ${itemId}`);
          thumbnailMetadata = await createVideoThumbnail(filePath);
          console.log(`[Queue] Converting video for ${itemId}`);
          mediaMetadata = await createGalleryVideo(filePath);
        } else {
          console.log(`[Queue] Creating thumbnail for ${itemId}`);
          thumbnailMetadata = await createThumbnail(filePath);
          console.log(`[Queue] Creating gallery image for ${itemId}`);
          mediaMetadata = await createGalleryImage(filePath);
        }

        // Update metadata with ready status
        await updateMetadataStatus(itemId, "ready");

        console.log(`[Queue] Completed ${itemId}`);
        galleryCountCache = undefined; // Trigger SSE update
      } catch (error) {
        console.error(`[Queue] Failed processing ${itemId}:`, error);
        await updateMetadataStatus(itemId, "error");
        // Don't cleanup files on error - keep the upload
      }
    });
  };

  // Restore processing queue from disk on startup
  const restoreProcessingQueue = async () => {
    try {
      console.log("[Queue] Scanning for incomplete processing tasks...");
      const metadataFiles = await fs.readdir(METADATA_FOLDER_PATH);

      let restoredCount = 0;
      for (const file of metadataFiles) {
        if (!file.endsWith(".json")) continue;

        try {
          const metadataPath = `${METADATA_FOLDER_PATH}/${file}`;
          const content = await fs.readFile(metadataPath, "utf8");
          const metadata = JSON.parse(content);

          // Re-queue items that were processing when server stopped
          if (metadata.status === "processing") {
            const itemId = file.replace(".json", "");
            const isVideo = metadata.type === "video";
            const fileExtension = metadata.fileExtension;

            if (!fileExtension) {
              console.warn(
                `[Queue] No file extension stored for ${itemId}, marking as error`
              );
              await updateMetadataStatus(itemId, "error");
              continue;
            }

            // Use the stored file extension to locate the file
            const actualFilePath = `${UPLOAD_FOLDER_PATH}${itemId}${fileExtension}`;

            try {
              await fs.access(actualFilePath);
              console.log(`[Queue] Restoring ${itemId} to processing queue`);
              processMediaItem(itemId, actualFilePath, isVideo);
              restoredCount++;
            } catch {
              console.warn(
                `[Queue] Could not find file for ${itemId} at ${actualFilePath}, marking as error`
              );
              await updateMetadataStatus(itemId, "error");
            }
          }
        } catch (err) {
          console.error(`[Queue] Error restoring ${file}:`, err);
        }
      }

      if (restoredCount > 0) {
        console.log(
          `[Queue] Restored ${restoredCount} items to processing queue`
        );
      } else {
        console.log("[Queue] No incomplete tasks found");
      }
    } catch (err) {
      console.error("[Queue] Error during queue restoration:", err);
    }
  };

  router.post(
    "/gallery",
    upload.single("file"),
    async (req: Request, res: Response) => {
      console.log(req.file);
      console.log(req.body);

      try {
        if (!req.file) {
          throw new Error("No file uploaded");
        }

        const isVideo = isVideoFile(req.file.mimetype);
        const fileExtension = getFileExtension(req.file.mimetype, req.file.originalname);
        console.log(req.file.path, isVideo ? "(video)" : "(image)", fileExtension);

        const baseFilePath = req.file.path.replace("\\tmp", "");
        const filePath = baseFilePath + fileExtension;

        await fs.rename(req.file.path, filePath);
        console.log("Moved to: ", filePath);

        // Validate video duration (keep immediate feedback for user)
        if (isVideo) {
          const videoMeta = await getVideoMetadata(filePath);
          if (videoMeta.duration > MAX_VIDEO_DURATION_SECONDS) {
            await fs.unlink(filePath);
            res.status(400).json({
              message: `Video too long. Maximum duration is ${MAX_VIDEO_DURATION_SECONDS} seconds (${Math.round(MAX_VIDEO_DURATION_SECONDS / 60)} minutes).`,
            });
            return;
          }
        }

        const uploadedDateTime = new Date().toISOString();

        // Save metadata with "processing" status
        console.log("Saving metadata with processing status");
        await fs.writeFile(
          `${METADATA_FOLDER_PATH}/${req.file.filename}.json`,
          JSON.stringify(
            {
              user: req.body.user,
              uploadedDateTime,
              type: isVideo ? "video" : "image",
              status: "processing",
              fileExtension, // Store file extension for queue restoration
            },
            null,
            2
          )
        );

        // Queue background processing (non-blocking)
        processMediaItem(req.file.filename, filePath, isVideo);

        // Return immediately with processing status
        const result: ImageItemResponseModel = {
          id: req.file.filename,
          type: isVideo ? "video" : "image",
          status: "processing",
          user: req.body.user,
          name: req.file.filename + (isVideo ? ".mp4" : ".jpg"),
          uploadedDateTime,
        };

        res.status(201).json(result);
        console.log("Upload queued for processing");
      } catch (error) {
        console.error(error);

        if (req.file?.filename) cleanupAfterError(req.file.filename);

        res.status(500).json({
          message: "Error processing media",
          error: JSON.stringify(error),
        });
      } finally {
        galleryCountCache = undefined;
      }
    }
  );

  let galleryCountCache: number | undefined = undefined;

  app.get("/gallery/count-stream", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const sendCountUpdatedEvent = (count: number) => {
      const eventData: GalleryCountResponseModel = { count };
      res.write(`event: countUpdated\n`);
      res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    };

    let interval = setInterval(async () => {
      if (galleryCountCache) {
        sendCountUpdatedEvent(galleryCountCache);
        return;
      }

      const files = await fs.readdir(THUMBNAILS_FOLDER_PATH);
      const noteFiles = await fs.readdir(NOTES_FOLDER_PATH);

      const images: any[] = files.filter((fileName) =>
        fileName.endsWith(".webp")
      );

      galleryCountCache = images.length + noteFiles.length;

      sendCountUpdatedEvent(galleryCountCache);
    }, 1000);

    res.on("close", () => {
      clearInterval(interval);

      res.end();
    });
  });

  router.get("/gallery", async (req: Request, res: Response) => {
    try {
      const files = await fs.readdir(THUMBNAILS_FOLDER_PATH);

      const mediaItems: any[] = files
        .filter((fileName) => fileName.endsWith(".webp"))
        .map((thumbnailFileName) => {
          const baseId = thumbnailFileName.slice(0, -5); // Remove .webp

          return {
            id: baseId,
            type: "image", // Default, will be updated from metadata
            thumbnail: {
              url: `${SERVER_URL}/gallery/${encodeURIComponent(
                thumbnailFileName
              )}?thumbnail`,
            },
            image: {
              url: "", // Will be set after reading metadata
            },
            name: "",
          };
        });

      for (let i = 0; i < mediaItems.length; i++) {
        // First read common metadata to determine type and status
        try {
          const commonMetadataFileContent = await fs.readFile(
            METADATA_FOLDER_PATH + "/" + mediaItems[i].id + ".json",
            "utf8"
          );
          const commonMetadata = JSON.parse(commonMetadataFileContent);

          const isVideo = commonMetadata.type === "video";
          const mediaExtension = isVideo ? ".mp4" : ".jpg";
          const status = commonMetadata.status || "ready"; // Default to ready for backwards compatibility

          mediaItems[i] = {
            ...mediaItems[i],
            ...commonMetadata,
            type: commonMetadata.type || "image",
            status,
            name: mediaItems[i].id + mediaExtension,
          };

          // Only add image URL if processing is complete
          if (status === "ready") {
            mediaItems[i].image = {
              url: `${SERVER_URL}/gallery/${encodeURIComponent(
                mediaItems[i].id + mediaExtension
              )}`,
            };
          }
        } catch (err) {
          console.error(err);
          console.error(
            `Could not get common metadata for ${mediaItems[i].id}`
          );
          // Fallback to image with ready status
          mediaItems[i].status = "ready";
          mediaItems[i].image = {
            url: `${SERVER_URL}/gallery/${encodeURIComponent(
              mediaItems[i].id + ".jpg"
            )}`,
          };
          mediaItems[i].name = mediaItems[i].id + ".jpg";
        }

        // Only load thumbnail and media metadata if processing is complete
        if (mediaItems[i].status === "ready") {
          try {
            const thumbnailMetadataFileContent = await fs.readFile(
              THUMBNAILS_FOLDER_PATH + "/" + mediaItems[i].id + ".json",
              "utf8"
            );
            const thumbnailMetadata = JSON.parse(thumbnailMetadataFileContent);

            mediaItems[i] = {
              ...mediaItems[i],
              thumbnail: {
                ...mediaItems[i].thumbnail,
                ...thumbnailMetadata,
              },
            };
          } catch (err) {
            console.error(err);
            console.error(
              `Could not get thumbnail metadata for ${mediaItems[i].id}`
            );
          }

          try {
            const mediaMetadataFileContent = await fs.readFile(
              GALLERY_FOLDER_PATH + "/" + mediaItems[i].id + ".json",
              "utf8"
            );
            const mediaMetadata = JSON.parse(mediaMetadataFileContent);

            mediaItems[i] = {
              ...mediaItems[i],
              image: {
                ...mediaItems[i].image,
                ...mediaMetadata,
              },
              // Include duration for videos
              ...(mediaMetadata.duration !== undefined && {
                duration: mediaMetadata.duration,
              }),
            };
          } catch (err) {
            console.error(err);
            console.error(`Could not get media metadata for ${mediaItems[i].id}`);
          }
        }
      }

      res.json(mediaItems);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Unable to list gallery files.");
    }
  });

  router.get("/gallery/:fileName", async (req: Request, res: Response) => {
    let fileName = req.params.fileName;

    const isThumbnail = req.query.thumbnail !== undefined; // ?thumbnail

    //Sanitation
    fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

    const folderPath = isThumbnail
      ? THUMBNAILS_FOLDER_PATH
      : GALLERY_FOLDER_PATH;

    const filePath = path.resolve(folderPath, fileName);

    if (!filePath.startsWith(path.resolve(folderPath))) {
      return res.status(400).send("Invalid file path.");
    }

    try {
      await fs.access(filePath, constants.R_OK);

      res.download(filePath);
    } catch (err) {
      console.error(err);
      return res.status(404).send("File not found");
    }
  });

  router.delete("/gallery/:id", async (req: Request, res: Response) => {
    let fileName = `${req.params.id}`;

    //Sanitation
    fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

    const thumbnailFilePath = path.resolve(
      THUMBNAILS_FOLDER_PATH,
      `${fileName}.webp`
    );

    if (!thumbnailFilePath.startsWith(path.resolve(THUMBNAILS_FOLDER_PATH))) {
      return res.status(400).send("Invalid file path.");
    }

    try {
      await fs.unlink(thumbnailFilePath);
    } catch (err) {
      console.error(err);
      return res.status(404).send("File not found");
    }

    // Delete all associated files (both image and video variants)
    // Try common extensions for upload folder since files are now saved with extensions
    const possibleExtensions = [".mp4", ".mov", ".avi", ".webm", ".mkv", ".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const uploadFiles = possibleExtensions.map(ext =>
      path.resolve(UPLOAD_FOLDER_PATH, fileName + ext)
    );

    const filesToDelete = [
      path.resolve(THUMBNAILS_FOLDER_PATH, `${fileName}.json`),
      path.resolve(GALLERY_FOLDER_PATH, `${fileName}.jpg`),
      path.resolve(GALLERY_FOLDER_PATH, `${fileName}.mp4`), // video file
      path.resolve(GALLERY_FOLDER_PATH, `${fileName}.json`),
      path.resolve(METADATA_FOLDER_PATH, `${fileName}.json`),
      ...uploadFiles,
    ];

    await Promise.all(
      filesToDelete.map((f) => fs.unlink(f).catch(() => {}))
    );

    galleryCountCache = undefined;

    return res.status(204).json({
      id: req.params.id,
      message: "File deleted successfully",
    });
  });

  router.get("/notes", async (req: Request, res: Response) => {
    try {
      const files = await fs.readdir(NOTES_FOLDER_PATH);

      const noteInfos: any[] = files.map((fileName) => {
        return {
          id: fileName.slice(0, -5),
        };
      });

      for (let i = 0; i < files.length; i++) {
        try {
          const noteDetailsFileContent = await fs.readFile(
            NOTES_FOLDER_PATH + "/" + files[i],
            "utf8"
          );
          const noteDetails = JSON.parse(noteDetailsFileContent);

          noteInfos[i] = {
            ...noteInfos[i],
            ...noteDetails,
          };
        } catch (err) {
          console.error(err);
          console.error(`Could not get note details for ${noteInfos[i].id}`);
        }
        try {
          const user = await User.findByPk(noteInfos[i].userId);
          if (user) {
            noteInfos[i] = {
              ...noteInfos[i],
              userName: user.name,
            };
          }
        } catch (err) {
          console.error(err);
          console.error(
            `Could not get user details for note ${noteInfos[i].id}`
          );
        }
      }

      res.json(noteInfos);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Unable to list notes.");
    }
  });

  router.post("/notes", async (req: Request, res: Response) => {
    const { userId, userName, content } = req.body as NoteCreateRequestModel;

    const noteId = uuidv4();

    try {
      await User.upsert({
        id: userId,
        name: userName,
      });
      const createdDateTime = new Date().toISOString();
      await fs.writeFile(
        `${NOTES_FOLDER_PATH}/${noteId}.json`,
        JSON.stringify(
          {
            userId,
            content,
            createdDateTime,
          },
          null,
          2
        )
      );

      const returnNote: NoteResponseModel = {
        id: noteId,
        userId,
        userName,
        content,
        createdDateTime,
      };

      galleryCountCache = undefined;

      return res.status(201).json(returnNote);
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error creating note",
        error: JSON.stringify(error),
      });
    }
  });

  router.delete("/notes/:id", async (req: Request, res: Response) => {
    let fileName = `${req.params.id}.json`;

    //Sanitation
    fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

    const filePath = path.resolve(NOTES_FOLDER_PATH, fileName);

    if (!filePath.startsWith(path.resolve(NOTES_FOLDER_PATH))) {
      return res.status(400).send("Invalid file path.");
    }

    try {
      await fs.unlink(filePath);
    } catch (err) {
      return res.status(404).send("File not found");
    }

    galleryCountCache = undefined;

    return res.status(204).json({
      id: req.params.id,
      message: "Note deleted successfully",
    });
  });

  router.put("/users/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
      await User.upsert({
        id,
        name,
      });

      return res.status(204).json({
        id,
        message: "User updated successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error updating user",
        error: JSON.stringify(error),
      });
    }
  });

  router.get("/users", async (req: Request, res: Response) => {
    try {
      const users = await User.findAll();

      res.json(users);
    } catch (err) {
      console.error(err);
      return res.status(500).send("Unable to list users.");
    }
  });

  router.use("/", express.static(path.resolve("public")));

  app.use(SERVER_BASE_PATH, router);

  // Restore any incomplete processing tasks before starting server
  await restoreProcessingQueue();

  server.listen(SERVER_PORT, () => {
    console.log(`Server started on ${SERVER_PORT}`);
  });
};

startServer();
