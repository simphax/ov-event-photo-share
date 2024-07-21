// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("node:fs/promises");
const path = require("path");
const sharp = require("sharp");

const UPLOAD_FOLDER_PATH = process.env.UPLOAD_FOLDER_PATH || "uploads/";
const THUMBNAILS_FOLDER_PATH =
  process.env.THUMBNAILS_FOLDER_PATH || "thumbnails/";
const METADATA_FOLDER_PATH = process.env.METADATA_FOLDER_PATH || "metadata/";
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

const fileFilter = (req, file, cb) => {
  if (file.mimetype == "image/jpeg" || file.mimetype == "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ dest: UPLOAD_FOLDER_PATH, fileFilter });

router.post("/gallery", upload.single("file"), async (req, res) => {
  console.log(req.file);
  console.log(req.body);

  try {
    const sharpFile = await sharp(req.file.path);
    const resizedImage = await sharpFile
      .rotate()
      .resize(200, 200, { fit: "inside" })
      .webp();

    const resizedImageBuffer = await resizedImage.toBuffer();

    const thumbnailFilePath = `${THUMBNAILS_FOLDER_PATH}/${req.file.filename}.webp`

    await fs.writeFile(
      thumbnailFilePath,
      resizedImageBuffer
    );
    const metadata = await sharp(
      thumbnailFilePath
    ).metadata();

    const uploadedDateTime = new Date().toISOString();

    await fs.writeFile(
      `${METADATA_FOLDER_PATH}/${req.file.filename}.json`,
      JSON.stringify(
        {
          size: metadata.size,
          width: metadata.width,
          height: metadata.height,
          user: req.body.user,
          uploadedDateTime,
        },
        null,
        2
      )
    );

    return res.status(201).json({
      id: req.file.filename,
      url: `${SERVER_URL}/gallery/${encodeURIComponent(
        req.file.filename
      )}.webp`,
      size: metadata.size,
      width: metadata.width,
      height: metadata.height,
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

router.get("/gallery", async (req, res) => {
  try {
    const files = await fs.readdir(THUMBNAILS_FOLDER_PATH);

    const fileInfo = files.map((fileName) => {
      return {
        id: fileName.slice(0, -5),
        url: `${SERVER_URL}/gallery/${encodeURIComponent(fileName)}`,
        name: fileName,
      };
    });
    for (let i = 0; i < fileInfo.length; i++) {
      try {
        let metadata = await fs.readFile(
          METADATA_FOLDER_PATH + "/" + fileInfo[i].id + ".json",
          "utf8"
        );
        metadata = JSON.parse(metadata);
        fileInfo[i] = {
          ...fileInfo[i],
          ...metadata,
        };
      } catch (err) {
        console.error(err);
        console.error(`Could not get metadata for ${fileInfo[i].id}`);
      }
    }

    res.json(fileInfo);
  } catch (err) {
    console.error(err);
    return res.status(500).send("Unable to list files.");
  }
});

router.get("/gallery/:fileName", async (req, res) => {
  let fileName = req.params.fileName;

  //Sanitation
  fileName = fileName.replace(/(\.\.[\/\\])+/g, "");

  const filePath = path.resolve(THUMBNAILS_FOLDER_PATH, fileName);

  if (!filePath.startsWith(path.resolve(THUMBNAILS_FOLDER_PATH))) {
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
