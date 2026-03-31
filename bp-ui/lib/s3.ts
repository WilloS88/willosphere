import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const uploadToS3 = async (
  prefix:     string,
  file:       Buffer,
  fileName:   string,
  mimeType:   string,
): Promise<string> => {
  const key = `${prefix}/${Date.now()}-${fileName}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket:       process.env.AWS_S3_BUCKET!,
      Key:          key,
      Body:         file,
      ContentType:  mimeType,
    }),
  );

  return key;
};

export const uploadTrackToS3 = (file: Buffer, fileName: string, mimeType: string) =>
  uploadToS3("tracks", file, fileName, mimeType);

export const uploadCoverToS3 = (file: Buffer, fileName: string, mimeType: string) =>
  uploadToS3("covers", file, fileName, mimeType);

export const uploadAvatarToS3 = (file: Buffer, fileName: string, mimeType: string) =>
  uploadToS3("avatars", file, fileName, mimeType);