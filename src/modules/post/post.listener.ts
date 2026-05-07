import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { FileService } from '@/helper/file.service';

export class PostDeletedEvent {
  constructor(public readonly files: { url: string; key: string }[]) {}
}

@Injectable()
export class PostListener {
  constructor(private readonly fileService: FileService) {}

  @OnEvent('post.deleted')
  async handlePostDeletedEvent(event: PostDeletedEvent) {
    if (!event.files || event.files.length === 0) return;

    console.log(`🚀 Background: Cleaning up ${event.files.length} images from Cloudinary...`);

    for (const file of event.files) {
      try {
        await this.fileService.deleteFromCloudinary(file.url, file.key);
      } catch (error) {
        console.error(`❌ Failed to delete file from Cloudinary: ${file.url}`, error);
      }
    }
  }
}
