import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const s3Client = process.env.S3_ENDPOINT ? new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
  forcePathStyle: true,
}) : null;

export async function uploadFile(fileName: string, buffer: Buffer): Promise<string> {
  if (buffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error("Upload exceeds the 10 MB limit.");
  }
  const safeFileName = path
    .basename(fileName)
    .normalize("NFKC")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/^\.+/, "");
  if (!safeFileName) {
    throw new Error("Upload file name is invalid.");
  }

  if (STORAGE_TYPE === "s3" && s3Client) {
    const key = `uploads/${Date.now()}-${safeFileName}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
    }));
    return key;
  } else {
    const key = `${Date.now()}-${safeFileName}`;
    const uploadRoot = path.resolve(process.cwd(), UPLOAD_DIR);
    const filePath = path.resolve(uploadRoot, key);
    if (!filePath.startsWith(`${uploadRoot}${path.sep}`)) {
      throw new Error("Upload path is invalid.");
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return key;
  }
}

export async function getDownloadUrl(key: string): Promise<string> {
  if (STORAGE_TYPE === "s3" && s3Client) {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  } else {
    return `/api/files/${key}`;
  }
}
