import fs from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

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
  if (STORAGE_TYPE === "s3" && s3Client) {
    const key = `uploads/${Date.now()}-${fileName}`;
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: buffer,
    }));
    return key;
  } else {
    // Local storage
    const key = `${Date.now()}-${fileName}`;
    const filePath = path.join(process.cwd(), UPLOAD_DIR, key);
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
    // For local, we'd typically serve via a route like /api/files/[key]
    return `/api/files/${key}`;
  }
}
