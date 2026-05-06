import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppEvents {
  constructor(private emitter: EventEmitter2) {}

  async bidCreated(data: any) {
    await this.emitter.emit('bid-created', data);
  }

  async bidUpdated(data: any) {
    await this.emitter.emit('bid-updated', data);
  }

  async bidSelected(data: any) {
    await this.emitter.emit('bid-selected', data);
  }

  async bidRejected(data: any) {
    await this.emitter.emit('bid-rejected', data);
  }

  async bidDeleted(data: any) {
    await this.emitter.emit('bid-deleted', data);
  }

  async fileDeleted(data: { url: string; key?: string }) {
    await this.emitter.emit('file-deleted', data);
  }
}
