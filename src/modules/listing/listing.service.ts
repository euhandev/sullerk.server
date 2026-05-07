import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '@/helper/prisma.service';
import { CreateListingDto, FileItem } from './dto/create-listing.dto';
import { FileService as HelperFileService } from '@/helper/file.service';
import { ApiError } from '@/utils/api_error';
import { FileAs, FileContext, FileModule, Listing } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { listingFilterFields, listingInclude, listingSearchFields } from './listing.constant';
import { IGenericResponse } from '@/interface/common';
import { Request } from 'express';

@Injectable()
export class ListingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: HelperFileService,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * Upload single media file with purpose and context
   */
  async uploadMedia(
    file: any,
    purpose: FileAs,
    userId: string,
    context: FileContext = FileContext.CREATE,
  ) {
    if (!file) return null;

    let folder = 'listings/others';
    if (purpose === FileAs.PHOTOS) folder = 'listings/photos';
    if (purpose === FileAs.PROOF_PHOTO) folder = 'listings/proof';
    if (purpose === FileAs.PROOF_VIDEO) folder = 'listings/video_proof';
    if (purpose === FileAs.COA_FILE) folder = 'listings/coa';

    const { url, key } = await this.fileService.autoUpload(file, folder);

    return await this.prisma.file.create({
      data: {
        url,
        key,
        name: file.originalname,
        purpose: purpose,
        uploadedById: userId,
        isPending: true,
        context: context,
        module: FileModule.LISTING,
      },
    });
  }

  /**
   * Create listing and attach pending files
   */
  async create(createListingDto: CreateListingDto, userId: string) {
    const { photos, proofPhoto, proofVideo, coaFile, ...listingData } = createListingDto;

    // 1. Validate customer
    const customer = await this.prisma.customer.findUnique({
      where: { userId },
    });
    if (!customer) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');
    }

    // 2. Resolve files into composite objects {id, url}
    const resolveFiles = async (items: FileItem[]) => {
      if (!items?.length) return [];

      const allUserFiles = await this.prisma.file.findMany({
        where: { uploadedById: userId },
      });

      // Map and filter to ensure we only keep files that actually exist for this user
      const uniqueResults = new Map<string, { fileId: string; url: string }>();
      for (const item of items) {
        // Find by ID or URL to be extra safe, though we expect both to be present
        const file = allUserFiles.find((f) => f.id === item.fileId || f.url === item.url);
        if (file && !uniqueResults.has(file.id)) {
          uniqueResults.set(file.id, { fileId: file.id, url: file.url });
        }
      }

      return Array.from(uniqueResults.values());
    };

    const resolvedPhotos = await resolveFiles(photos || []);
    const resolvedProofPhotos = await resolveFiles(proofPhoto || []);
    const resolvedProofVideos = await resolveFiles(proofVideo || []);
    const resolvedCoaFiles = await resolveFiles(coaFile || []);

    const allResolvedIds = Array.from(
      new Set([
        ...resolvedPhotos.map((f) => f.fileId),
        ...resolvedProofPhotos.map((f) => f.fileId),
        ...resolvedProofVideos.map((f) => f.fileId),
        ...resolvedCoaFiles.map((f) => f.fileId),
      ]),
    ).filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    return await (this.prisma as any).$transaction(async (tx) => {
      // 3. Create Listing with composite arrays
      const listing = await tx.listing.create({
        data: {
          ...listingData,
          acquiredDate: listingData.acquiredDate ? new Date(listingData.acquiredDate) : null,
          ownerId: customer.id,
          status: createListingDto.isPauseListing ? 'PAUSED' : 'PENDING',
          photos: resolvedPhotos,
          proofPhotos: resolvedProofPhotos,
          proofVideos: resolvedProofVideos,
          coaFiles: resolvedCoaFiles,
        },
      });

      // 4. Attach selected files to listing and clear pending status
      for (const fileId of allResolvedIds) {
        await tx.file.updateMany({
          where: {
            id: fileId,
            uploadedById: userId,
            isPending: true,
          },
          data: {
            listingId: listing.id,
            isPending: false,
          },
        });
      }

      // 5. Cleanup: Delete unused pending files for this user
      const unusedFiles = await tx.file.findMany({
        where: {
          uploadedById: userId,
          isPending: true,
          listingId: null,
        },
      });

      if (unusedFiles.length > 0) {
        for (const file of unusedFiles) {
          // Delete from storage
          await this.fileService.autoDelete(file.url, file.key);
        }

        // Delete from DB
        await tx.file.deleteMany({
          where: {
            id: { in: unusedFiles.map((f) => f.id) },
          },
        });
      }

      // 6. Create History
      await tx.listingHistory.create({
        data: {
          listingId: listing.id,
          customerId: customer.id,
        },
      });

      // Return listing with files
      return await tx.listing.findUnique({
        where: { id: listing.id },
        include: { files: true },
      });
    });
  }
  /**
   * Delete a pending file manually (Async Queue)
   */
  async deletePendingFile(fileId: string, userId: string) {
    const file = await this.prisma.file.findFirst({
      where: {
        id: fileId,
        uploadedById: userId,
        isPending: true,
        module: FileModule.LISTING,
      },
    });

    if (!file) {
      throw new ApiError(HttpStatus.NOT_FOUND, 'Pending file not found or already attached');
    }

    const fileUrl = file.url;
    const fileKey = file.key;

    // Delete from DB immediately
    await this.prisma.file.delete({
      where: { id: fileId },
    });

    // Emit event for background physical deletion
    await this.fileDeleted({ url: fileUrl, key: fileKey });

    return { success: true };
  }

  async fileDeleted(data: { url: string; key?: string }) {
    await this.emitter.emit('file-deleted', data);
  }

  /**
   * Toggle Love/Star status for a listing
   */
  async toggleStar(listingId: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const existing = await this.prisma.starredListing.findUnique({
      where: {
        customerId_listingId: { customerId: customer.id, listingId },
      },
    });

    if (existing) {
      await this.prisma.starredListing.delete({ where: { id: existing.id } });
      return { starred: false };
    } else {
      await this.prisma.starredListing.create({
        data: { customerId: customer.id, listingId },
      });
      return { starred: true };
    }
  }

  /**
   * Toggle Watchlist status for a listing
   */
  async toggleWatchlist(listingId: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    const existing = await this.prisma.watchlist.findUnique({
      where: {
        customerId_listingId: { customerId: customer.id, listingId },
      },
    });

    if (existing) {
      await this.prisma.watchlist.delete({ where: { id: existing.id } });
      return { watching: false };
    } else {
      await this.prisma.watchlist.create({
        data: { customerId: customer.id, listingId },
      });
      return { watching: true };
    }
  }

  /**
   * Record a share action for a listing
   */
  async share(listingId: string, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { userId } });
    if (!customer) throw new ApiError(HttpStatus.NOT_FOUND, 'Customer profile not found');

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create share record (ignore if already exists for this user to avoid double counting)
      const existing = await tx.listingShare.findUnique({
        where: { customerId_listingId: { customerId: customer.id, listingId } },
      });

      if (!existing) {
        await tx.listingShare.create({
          data: { customerId: customer.id, listingId },
        });

        // 2. Increment shares count on listing
        await tx.listing.update({
          where: { id: listingId },
          data: { sharesCount: { increment: 1 } },
        });
      }

      return { success: true };
    });
  }

  /**
   * Get all listings with optimized search, filter, and pagination
   */
  async findAll(req: Request): Promise<IGenericResponse<Listing[]>> {
    const query = req.query;
    const queryBuilder = new QueryBuilder(query, this.prisma.listing);

    const [data, meta] = await Promise.all([
      queryBuilder
        .filter(listingFilterFields)
        .search(listingSearchFields)
        .sort()
        .paginate()
        .fields()
        .include(listingInclude)
        .execute(),
      queryBuilder.countTotal(),
    ]);

    return { meta, data };
  }
}
