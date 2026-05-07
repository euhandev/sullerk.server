import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileService } from '@/helper/file.service';

@Injectable()
export class FileListener {
  private readonly logger = new Logger(FileListener.name);

  constructor(private readonly fileService: FileService) {}

  @OnEvent('file-deleted', { async: true })
  async handleFileDeletedEvent(payload: { url: string; key?: string }) {
    this.logger.log(
      `Background task: Deleting file from storage: ${payload.url} (Key: ${payload.key || 'N/A'})`,
    );
    try {
      if (payload.url.includes('cloudinary')) {
        await this.fileService.deleteFromCloudinary(payload.url, payload.key);
      } else if (payload.url.includes('digitaloceanspaces')) {
        await this.fileService.deleteFromDigitalOcean(payload.url);
      } else {
        await this.fileService.deleteFromLocal(payload.url);
      }
      this.logger.log(`Successfully deleted file from storage: ${payload.url}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from storage: ${payload.url}`, error.stack);
    }
  }
}
