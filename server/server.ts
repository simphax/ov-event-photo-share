import express, { Request, Response } from "express";
import cors from "cors";
import multer, { FileFilterCallback } from "multer";
import { promises as fs } from "fs";
import path from "path";
import sharp from "sharp";
import { Sequelize, Model, DataTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";
import { NoteResponseModel } from "../common/types/NoteResponseModel";
import { ImageItemResponseModel } from "../common/types/ImageItemResponseModel";
import { NoteCreateRequestModel } from "../common/types/NoteCreateRequestModel";

const UPLOAD_FOLDER_PATH = process.env.UPLOAD_FOLDER_PATH || "uploads/";
const METADATA_FOLDER_PATH = process.env.METADATA_FOLDER_PATH || "metadata/";
const NOTES_FOLDER_PATH = process.env.NOTES_FOLDER_PATH || "notes/";
const THUMBNAILS_FOLDER_PATH =
  process.env.THUMBNAILS_FOLDER_PATH || "thumbnails/";
const GALLERY_FOLDER_PATH = process.env.GALLERY_FOLDER_PATH || "gallery/";
const SERVER_PORT = process.env.SERVER_PORT || 5050;
const SERVER_URL = process.env.SERVER_URL || "http://192.168.1.247:5050";
const SERVER_BASE_PATH = process.env.SERVER_BASE_PATH || "/";

const corsOptions: cors.CorsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
};

const app = express();
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
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ dest: UPLOAD_FOLDER_PATH, fileFilter });

const createThumbnail = async (filePath: string) => {
  const filename = path.basename(filePath);
  const sharpFile = await sharp(filePath);
  const resizedImage = await sharpFile
    .rotate()
    .resize(200, 200, { fit: "inside" })
    .webp();

  const resizedImageBuffer = await resizedImage.toBuffer();

  const thumbnailFilePath = `${THUMBNAILS_FOLDER_PATH}/${filename}.webp`;

  await fs.writeFile(thumbnailFilePath, resizedImageBuffer);

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
    url: `${SERVER_URL}/gallery/${encodeURIComponent(filename)}.webp?thumbnail`,
    size: thumbnailMetadata.size,
    width: thumbnailMetadata.width,
    height: thumbnailMetadata.height,
  };
};

const createGalleryImage = async (filePath: string) => {
  const filename = path.basename(filePath);
  const sharpFile = await sharp(filePath);
  const resizedImage = await sharpFile
    .rotate()
    .resize(1080, 1920, { fit: "inside" })
    .webp();

  const resizedImageBuffer = await resizedImage.toBuffer();

  const imageFilePath = `${GALLERY_FOLDER_PATH}/${filename}.webp`;

  await fs.writeFile(imageFilePath, resizedImageBuffer);

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
    url: `${SERVER_URL}/gallery/${encodeURIComponent(filename)}.webp`,
    size: imageMetadata.size,
    width: imageMetadata.width,
    height: imageMetadata.height,
  };
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

      const thumbnailMetadata = await createThumbnail(req.file.path);
      const imageMetadata = await createGalleryImage(req.file.path);

      const uploadedDateTime = new Date().toISOString();

      await fs.writeFile(
        `${METADATA_FOLDER_PATH}/${req.file.filename}.json`,
        JSON.stringify(
          {
            user: req.body.user,
            uploadedDateTime,
          },
          null,
          2
        )
      );

      return res.status(201).json({
        id: req.file.filename,
        thumbnail: {
          url: thumbnailMetadata.url,
          size: thumbnailMetadata.size,
          width: thumbnailMetadata.width,
          height: thumbnailMetadata.height,
        },
        image: {
          url: imageMetadata.url,
          size: imageMetadata.size,
          width: imageMetadata.width,
          height: imageMetadata.height,
        },
        user: req.body.user,
        uploadedDateTime,
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Error creating thumbnail",
        error: JSON.stringify(error),
      });
    }
  }
);

router.get("/gallery", async (req: Request, res: Response) => {
  try {
    const files = await fs.readdir(THUMBNAILS_FOLDER_PATH);

    const imageItems: any[] = files
      .filter((fileName) => fileName.endsWith(".webp"))
      .map((fileName) => {
        return {
          id: fileName.slice(0, -5),
          thumbnail: {
            url: `${SERVER_URL}/gallery/${encodeURIComponent(
              fileName
            )}?thumbnail`,
          },
          image: {
            url: `${SERVER_URL}/gallery/${encodeURIComponent(fileName)}`,
          },
          name: fileName,
        };
      });

    for (let i = 0; i < imageItems.length; i++) {
      try {
        const commonMetadataFileContent = await fs.readFile(
          METADATA_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        const commonMetadata = JSON.parse(commonMetadataFileContent);

        imageItems[i] = {
          ...imageItems[i],
          ...commonMetadata,
        };
      } catch (err) {
        console.error(err);
        console.error(`Could not get common metadata for ${imageItems[i].id}`);
      }

      try {
        const thumbnailMetadataFileContent = await fs.readFile(
          THUMBNAILS_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        const thumbnailMetadata = JSON.parse(thumbnailMetadataFileContent);

        imageItems[i] = {
          ...imageItems[i],
          thumbnail: {
            ...imageItems[i].thumbnail,
            ...thumbnailMetadata,
          },
        };
      } catch (err) {
        console.error(err);
        console.error(
          `Could not get thumbnail metadata for ${imageItems[i].id}`
        );
      }

      try {
        const imageMetadataFileContent = await fs.readFile(
          GALLERY_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        const imageMetadata = JSON.parse(imageMetadataFileContent);

        imageItems[i] = {
          ...imageItems[i],
          image: {
            ...imageItems[i].image,
            ...imageMetadata,
          },
        };
      } catch (err) {
        console.error(err);
        console.error(`Could not get image metadata for ${imageItems[i].id}`);
      }
    }

    res.json(imageItems);
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

  const folderPath = isThumbnail ? THUMBNAILS_FOLDER_PATH : GALLERY_FOLDER_PATH;

  const filePath = path.resolve(folderPath, fileName);

  if (!filePath.startsWith(path.resolve(folderPath))) {
    return res.status(400).send("Invalid file path.");
  }

  try {
    await fs.access(filePath);

    res.sendFile(filePath);
  } catch (err) {
    return res.status(404).send("File not found");
  }
});

router.delete("/gallery/:id", async (req: Request, res: Response) => {
  let fileName = `${req.params.id}.webp`;

  //Sanitation
  fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

  const thumbnailsFilePath = path.resolve(THUMBNAILS_FOLDER_PATH, fileName);

  if (!thumbnailsFilePath.startsWith(path.resolve(THUMBNAILS_FOLDER_PATH))) {
    return res.status(400).send("Invalid file path.");
  }

  try {
    await fs.unlink(thumbnailsFilePath);
  } catch (err) {
    return res.status(404).send("File not found");
  }

  fileName = `${req.params.id}`;
  //Sanitation
  fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

  const originalFilePath = path.resolve(UPLOAD_FOLDER_PATH, fileName);

  if (!originalFilePath.startsWith(path.resolve(UPLOAD_FOLDER_PATH))) {
    return res.status(400).send("Invalid file path.");
  }

  try {
    await fs.unlink(originalFilePath);
  } catch (err) {
    return res.status(404).send("File not found");
  }

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
        console.error(`Could not get user details for note ${noteInfos[i].id}`);
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

router.use("/", express.static(path.resolve("public")));

app.use(SERVER_BASE_PATH, router);

app.listen(SERVER_PORT, () => {
  console.log(`Server started on ${SERVER_PORT}`);
});
