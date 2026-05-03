/* eslint-disable no-useless-catch */
import { Injectable } from '@nestjs/common';
import { Readable } from 'stream';

import { v2 as cloudinary } from 'cloudinary';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import slugify from 'slugify';
import { ConfigService } from '@/config/config.service';
import * as fs from 'fs-extra';
import sharp from 'sharp';
import * as path from 'path';
import * as os from 'os';
import { randomUUID } from 'crypto';

@Injectable()
export class FileService {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });

    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: this.configService.get('DO_SPACE_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.get('DO_SPACE_ACCESS_KEY'),
        secretAccessKey: this.configService.get('DO_SPACE_SECRET_KEY'),
      },
    });
  }

  /**
   * Convert image to .webp using Sharp
   */
  private async convertToWebP(originalPath: string): Promise<string> {
    const newFilename = `${randomUUID()}.webp`;
    const newPath = path.join(os.tmpdir(), newFilename);

    await sharp(originalPath).webp({ quality: 80 }).toFile(newPath);

    return newPath;
  }

  /**
   * Uploads a single file to Cloudinary and returns its URL.
   */
  async uploadToCloudinary(file: Express.Multer.File, folder: string = 'general'): Promise<string> {
    if (file.buffer) {
      return this.uploadBufferToCloudinary(file, folder);
    }

    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file.path, { folder }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
      if (file.path) {
        await fs.unlink(file.path).catch(() => {}); // Clean up temp file
      }
      return (result as { secure_url: string }).secure_url;
    } catch (error) {
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      throw error;
    }
  }

  /**
   * Uploads an in-memory file buffer directly to Cloudinary
   */
  async uploadBufferToCloudinary(
    file: Express.Multer.File,
    folder: string = 'general',
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        },
      );
      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Uploads multiple files to Cloudinary and returns their URLs.
   */
  async uploadMultipleToCloudinary(
    files: Express.Multer.File[],
    folder: string = 'general',
  ): Promise<string[]> {
    try {
      const uploadPromises = files?.map((file) => this.uploadToCloudinary(file, folder));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw error;
    }
  }

  async deleteFromCloudinary(url: string): Promise<void> {
    try {
      if (!url) return;
      const urlParts = url.split('/upload/');
      if (urlParts.length > 1) {
        const afterUpload = urlParts[1];
        const withoutVersion = afterUpload.replace(/^v\d+\//, '');
        const publicIdWithExt = withoutVersion;
        const publicId =
          publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;

        let resourceType = 'image';
        if (url.includes('/video/upload/')) {
          resourceType = 'video';
        } else if (url.includes('/raw/upload/')) {
          resourceType = 'raw';
        }

        await new Promise((resolve, reject) => {
          cloudinary.uploader.destroy(
            publicId,
            { resource_type: resourceType },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
        });
      }
    } catch (error) {
      console.error('Failed to delete from Cloudinary:', error);
    }
  }

  /**
   * Deletes multiple files from Cloudinary.
   */
  async deleteMultipleFromCloudinary(urls: string[]): Promise<void> {
    try {
      const deletePromises = urls.map((url) => this.deleteFromCloudinary(url));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Failed to delete files from Cloudinary: ${error.message}`);
    }
  }

  async uploadToDigitalOcean(file: Express.Multer.File): Promise<string> {
    try {
      const fileStream = fs.createReadStream(file.path);
      const key = slugify(`${randomUUID()}-${file.originalname}`, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        trim: true,
      });
      const bucket = this.configService.get('DO_SPACE_BUCKET');
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: fileStream,
          ACL: 'public-read',
          ContentType: file.mimetype,
        }),
      );
      // `${config.aws.do_space_endpoint}/${config.aws.do_space_bucket}/${key}`;
      const location = `${this.configService.get('DO_SPACE_ENDPOINT')}/${bucket}/${key}`;
      await fs.unlink(file.path);
      return location;
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      throw error;
    }
  }

  /**
   * Uploads multiple files to DigitalOcean Spaces and returns their URLs.
   */
  async uploadMultipleToDigitalOcean(
    files: Express.Multer.File[],
    type?: 'disk' | 'memory',
  ): Promise<string[]> {
    try {
      if (!type || type === 'disk') {
        const uploadPromises = files?.map((file) => this.uploadToDigitalOcean(file));
        return await Promise.all(uploadPromises);
      } else {
        const uploadPromises = files?.map((file) => this.uploadBufferToDigitalOcean(file));
        return await Promise.all(uploadPromises);
      }
    } catch (error) {
      throw error;
    }
  }

  async deleteFromDigitalOcean(url: string): Promise<void> {
    const bucket = this.configService.get('DO_SPACE_BUCKET');
    const parsedUrl = new URL(url);

    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (pathSegments[0] !== bucket) {
      throw new Error(
        `Bucket mismatch. Expected '${bucket}' but found '${pathSegments[0]}' in URL: ${url}`,
      );
    }

    const key = pathSegments.slice(1).join('/');
    if (!key) {
      throw new Error(`Invalid key (empty) in URL: ${url}`);
    }

    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  }

  /**
   * Deletes multiple files from DigitalOcean Spaces.
   */
  async deleteMultipleFromDigitalOcean(urls: string[]): Promise<void> {
    try {
      const deletePromises = urls.map((url) => this.deleteFromDigitalOcean(url));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Failed to delete files from DigitalOcean: ${error.message}`);
    }
  }

  async uploadBufferToDigitalOcean(file: Express.Multer.File): Promise<string> {
    try {
      const key = slugify(`${new Date().getTime()}-${file.originalname}`, {
        replacement: '-',
        remove: undefined,
        lower: false,
        strict: false,
        trim: true,
      });

      const bucket = this.configService.get('DO_SPACE_BUCKET');

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: file.buffer, // 🔑 in-memory buffer
          ACL: 'public-read',
          ContentType: file.mimetype,
        }),
      );

      return `${this.configService.get('DO_SPACE_ENDPOINT')}/${bucket}/${key}`;
    } catch (error) {
      throw new Error(`Failed to upload buffer to DigitalOcean: ${error.message}`);
    }
  }

  async uploadToLocal(file: Express.Multer.File): Promise<string> {
    const webpPath = await this.convertToWebP(file.path);
    const fileName = `${randomUUID()}.webp`;
    const localDir = path.join(process.cwd(), 'files');
    const localPath = path.join(localDir, fileName);

    try {
      await fs.ensureDir(localDir);
      await fs.move(webpPath, localPath);

      await fs.unlink(file.path);
      return `${this.configService.get('SERVER_URL')}/api/v1/files/${fileName}`;
    } catch (error) {
      await fs.unlink(file.path).catch(() => {});
      await fs.unlink(webpPath).catch(() => {});
      throw error;
    }
  }

  async uploadMultipleToLocal(files: Express.Multer.File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadToLocal(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      throw error;
    }
  }

  async deleteFromLocal(filePathOrUrl: string): Promise<void> {
    try {
      const fileName = path.basename(filePathOrUrl); // Extract filename
      const fullPath = path.join(process.cwd(), 'files', fileName);

      if (await fs.pathExists(fullPath)) {
        await fs.unlink(fullPath);
      } else {
        throw new Error('File not found in local storage');
      }
    } catch (error) {
      throw new Error(`Failed to delete local file: ${error.message}`);
    }
  }

  async deleteMultipleFromLocal(filePathsOrUrls: string[]): Promise<void> {
    try {
      const deletePromises = filePathsOrUrls.map((url) => this.deleteFromLocal(url));
      await Promise.all(deletePromises);
    } catch (error) {
      throw new Error(`Failed to delete multiple local files: ${error.message}`);
    }
  }
}
