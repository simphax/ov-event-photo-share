// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("path");
const sharp = require("sharp");
const { Sequelize, Model, DataTypes } = require("sequelize");

const UPLOAD_FOLDER_PATH = process.env.UPLOAD_FOLDER_PATH || "uploads/";
const METADATA_FOLDER_PATH = process.env.METADATA_FOLDER_PATH || "metadata/";
const NOTES_FOLDER_PATH = process.env.NOTES_FOLDER_PATH || "notes/";
const THUMBNAILS_FOLDER_PATH =
  process.env.THUMBNAILS_FOLDER_PATH || "thumbnails/";
const GALLERY_FOLDER_PATH = process.env.GALLERY_FOLDER_PATH || "gallery/";
const SERVER_PORT = process.env.SERVER_PORT || 5050;
const SERVER_URL = process.env.SERVER_URL || "http://192.168.1.247:5050";
const SERVER_BASE_PATH = process.env.SERVER_BASE_PATH || "/";

const corsOptions = {
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
class User extends Model {}
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

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ dest: UPLOAD_FOLDER_PATH, fileFilter });

const createThumbnail = async (filePath) => {
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

const createGalleryImage = async (filePath) => {
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

router.post("/gallery", upload.single("file"), async (req, res) => {
  console.log(req.file);
  console.log(req.body);

  try {
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
      message: "File uploded successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error creating thumbnail",
      error: JSON.stringify(error),
    });
  }
});

router.get("/notes", async (req, res) => {
  try {
    const files = await fs.readdir(NOTES_FOLDER_PATH);

    const noteInfos = files.map((fileName) => {
      return {
        id: fileName.slice(0, -5),
      };
    });

    for (let i = 0; i < files.length; i++) {
      try {
        let noteDetails = await fs.readFile(
          NOTES_FOLDER_PATH + "/" + files[i],
          "utf8"
        );
        noteDetails = JSON.parse(noteDetails);

        noteInfos[i] = {
          ...noteInfos[i],
          ...noteDetails,
        };
      } catch (err) {
        console.error(err);
        console.error(`Could not get note details for ${noteInfos[i].id}`);
      }
      try {
        const user = await User.findOne({ where: { id: noteInfos[i].userId } });
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

router.get("/gallery", async (req, res) => {
  try {
    const files = await fs.readdir(THUMBNAILS_FOLDER_PATH);

    const imageItems = files
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
        let commonMetadata = await fs.readFile(
          METADATA_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        commonMetadata = JSON.parse(commonMetadata);

        imageItems[i] = {
          ...imageItems[i],
          ...commonMetadata,
        };
      } catch (err) {
        console.error(err);
        console.error(`Could not get common metadata for ${imageItems[i].id}`);
      }
      try {
        let thumbnailMetadata = await fs.readFile(
          THUMBNAILS_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        thumbnailMetadata = JSON.parse(thumbnailMetadata);

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
        let imageMetadata = await fs.readFile(
          GALLERY_FOLDER_PATH + "/" + imageItems[i].id + ".json",
          "utf8"
        );
        imageMetadata = JSON.parse(imageMetadata);

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

router.get("/gallery/:fileName", async (req, res) => {
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

router.delete("/gallery/:id", async (req, res) => {
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

  return res.status(201).json({
    id: req.params.id,
    message: "File deleted successfully",
  });
});

router.use("/", express.static(path.resolve("public")));

app.use(SERVER_BASE_PATH, router);

app.listen(SERVER_PORT, () => {
  console.log(`Server started on ${SERVER_PORT}`);
});
