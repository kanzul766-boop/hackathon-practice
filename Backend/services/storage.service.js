import { randomUUID } from "node:crypto";
import ImageKit from "@imagekit/nodejs";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  "image/jpeg": {
    extension: "jpg",
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  "image/webp": {
    extension: "webp",
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
};

function getImageType(buffer, mimeType) {
  const imageType = IMAGE_TYPES[mimeType];
  if (!imageType || !imageType.matches(buffer)) {
    throw new Error("Only valid JPEG, PNG, and WebP images are supported");
  }
  return imageType;
}

async function uploadFile(buffer, { mimeType, userId }) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("An image file is required");
  }
  if (buffer.length > MAX_IMAGE_SIZE) {
    throw new Error("Profile image must be 5 MB or smaller");
  }
  if (!userId) {
    throw new Error("User ID is required for profile image uploads");
  }

  const imageType = getImageType(buffer, mimeType);
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is required to upload files");
  }

  const client = new ImageKit({ privateKey });
  const response = await client.files.upload({
    file: buffer.toString("base64"),
    fileName: `${userId}-${randomUUID()}.${imageType.extension}`,
    folder: "/clinic-appointments/profiles",
  });

  if (!response.url) {
    throw new Error("ImageKit did not return an image URL");
  }

  return { url: response.url };
}

export default uploadFile;
