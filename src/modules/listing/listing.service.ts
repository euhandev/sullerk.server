import { HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/helper/prisma.service';
import { CreateListingDto, FileItem } from './dto/create-listing.dto';
import { FileService as HelperFileService } from '@/helper/file.service';
import { ApiError } from '@/utils/api_error';
import { FileAs, FileContext, FileModule, Listing, Role } from '@prisma/client';
import QueryBuilder from '@/utils/query_builder';
import { listingFilterFields, listingInclude, listingSearchFields } from './listing.constant';
import { IGenericResponse } from '@/interface/common';
import { Request } from 'express';
import { PriceEngineService } from '../price-engine/price-engine.service';
import { ConfigService } from '@/config/config.service';

import { UpdateListingDto } from './dto/update-listing.dto';

@Injectable()
export class ListingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: HelperFileService,
    private readonly emitter: EventEmitter2,
    private readonly priceEngine: PriceEngineService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Update an existing listing
   * Only the owner can update their own listing
   */
  async update(id: string, updateDto: UpdateListingDto, userId: string, role?: Role) {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Verify ownership
      const existing = await tx.listing.findUnique({
        where: { id },
        include: { owner: true },
      });

      if (!existing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');
      if (role === Role.CUSTOMER && existing.owner.userId !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, 'You can only edit your own listings');
      }

      const { photos, photoProofs, videoProofs, coaFiles, ...listingData } = updateDto;

      // 2. Decide if price needs recalculation
      const pricingFields: (keyof UpdateListingDto)[] = [
        'sport',
        'category',
        'signatureType',
        'photoProofType',
        'videoProofType',
        'coaStatus',
        'companyAuthentication',
        'appliedHonours',
        'cardNumbered',
        'cardFeature',
        'cardGrade',
      ];

      const needsRecalc = pricingFields.some((field) => updateDto[field] !== undefined);
      let pricingUpdate = {};

      if (needsRecalc) {
        // Merge existing values with updates for calculation
        const calcInput = {
          ...existing,
          ...updateDto,
        } as any;

        const priceResult = await this.priceEngine.calculatePrice(calcInput);

        pricingUpdate = {
          calculatedBasePrice: priceResult.finalPrice,
          priceBreakdown: priceResult.breakdown,
          priceEngineConfigId: priceResult.configId,
          displayPrice: priceResult.finalPrice,
          estimatedBaseValue: priceResult.finalPrice,
          initialPrice: priceResult.finalPrice,
        };

        // Create new log
        await tx.priceCalculationLog.create({
          data: {
            listingId: id,
            configId: priceResult.configId,
            finalPrice: priceResult.finalPrice,
            platformFee: priceResult.platformFee,
            sellerRangeMin: priceResult.sellerRange.min,
            sellerRangeMax: priceResult.sellerRange.max,
            inputContext: calcInput,
            breakdown: priceResult.breakdown,
          },
        });
      }

      // 3. Handle File Updates (Step 2 logic for EDIT context)
      const allResolvedIds: string[] = [];
      const fileUpdates: any = {};

      const resolveFiles = (files: any[] | undefined, fieldName: string) => {
        if (files) {
          const resolved = files.map((f) => ({ fileId: f.fileId, url: f.url }));
          fileUpdates[fieldName] = resolved;
          allResolvedIds.push(...files.map((f) => f.fileId));
        }
      };

      resolveFiles(photos, 'photos');
      resolveFiles(photoProofs, 'proofPhotos');
      resolveFiles(videoProofs, 'proofVideos');
      resolveFiles(coaFiles, 'coaFiles');

      // 4. Perform Update
      const updated = await tx.listing.update({
        where: { id },
        data: {
          ...listingData,
          ...pricingUpdate,
          ...fileUpdates,
          acquiredDate: listingData.acquiredDate ? new Date(listingData.acquiredDate) : undefined,
        },
        include: { files: true },
      });

      // 5. Attach new files to listing in File table
      if (allResolvedIds.length > 0) {
        for (const fileId of allResolvedIds) {
          await tx.file.updateMany({
            where: {
              id: fileId,
              uploadedById: userId,
              isPending: true,
            },
            data: {
              listingId: updated.id,
              isPending: false,
              context: 'EDIT',
            },
          });
        }
      }

      return updated;
    });
  }

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

    // 1. Validation: Ensure purpose matches file type and size limits
    const isImage = file.mimetype.startsWith('image/');
    const isVideo = file.mimetype.startsWith('video/');
    const isPDF = file.mimetype === 'application/pdf';
    const fileSizeMB = file.size / (1024 * 1024);

    const imageLimit = this.configService.getFileLimit('image');
    const videoLimit = this.configService.getFileLimit('video');
    const pdfLimit = this.configService.getFileLimit('pdf');

    // Purpose Type Validation
    if (purpose === FileAs.PROOF_VIDEO && !isVideo) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'A video file is required for PROOF_VIDEO');
    }
    if ((purpose === FileAs.PHOTOS || purpose === FileAs.PROOF_PHOTO) && !isImage) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'An image file is required for this purpose');
    }
    if (purpose === FileAs.COA_FILE && !isPDF && !isImage) {
      throw new ApiError(HttpStatus.BAD_REQUEST, 'Only PDF or Image files are allowed for COA');
    }

    // Granular Size Validation
    if (isImage && fileSizeMB > imageLimit) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Image size exceeds the ${imageLimit}MB limit`);
    }
    if (isPDF && fileSizeMB > pdfLimit) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `PDF document exceeds the ${pdfLimit}MB limit`);
    }
    if (isVideo && fileSizeMB > videoLimit) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `Video file exceeds the ${videoLimit}MB limit`);
    }

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
    const { photos, photoProofs, videoProofs, coaFiles, ...listingData } = createListingDto;

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
    const resolvedProofPhotos = await resolveFiles(photoProofs || []);
    const resolvedProofVideos = await resolveFiles(videoProofs || []);
    const resolvedCoaFiles = await resolveFiles(coaFiles || []);

    const allResolvedIds = Array.from(
      new Set([
        ...resolvedPhotos.map((f) => f.fileId),
        ...resolvedProofPhotos.map((f) => f.fileId),
        ...resolvedProofVideos.map((f) => f.fileId),
        ...resolvedCoaFiles.map((f) => f.fileId),
      ]),
    ).filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

    // 3. Price Engine Calculation
    const priceResult = await this.priceEngine.calculatePrice(createListingDto);

    return await (this.prisma as any).$transaction(async (tx) => {
      // 4. Create Listing with composite arrays and engine results
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

          // Engine fields (System Calculated - Overrides any user input)
          calculatedBasePrice: priceResult.finalPrice,
          priceBreakdown: priceResult.breakdown,
          priceEngineConfigId: priceResult.configId,
          displayPrice: priceResult.finalPrice,
          estimatedBaseValue: priceResult.finalPrice,
          initialPrice: priceResult.finalPrice,
        },
      });

      // 5. Create Calculation Log (Audit Trail)
      await tx.priceCalculationLog.create({
        data: {
          listingId: listing.id,
          configId: priceResult.configId,
          finalPrice: priceResult.finalPrice,
          platformFee: priceResult.platformFee,
          sellerRangeMin: priceResult.sellerRange.min,
          sellerRangeMax: priceResult.sellerRange.max,
          inputContext: createListingDto as any,
          breakdown: priceResult.breakdown,
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
   * Estimate price without creating a listing
   */
  async estimatePrice(dto: CreateListingDto) {
    return await this.priceEngine.calculatePrice(dto);
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

  /**
   * Get single listing details
   */
  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        ...listingInclude,
        files: true,
      },
    });

    if (!listing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');
    return listing;
  }

  /**
   * Toggle listing between ACTIVE and PAUSED status
   */
  async togglePause(id: string, userId: string, role?: Role) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { owner: true },
    });

    if (!listing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');
    if (role === Role.CUSTOMER && listing.owner.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You can only toggle your own listings');
    }

    const currentStatus = listing.status;
    let newStatus: any;

    if (currentStatus === 'ACTIVE') {
      newStatus = 'PAUSED';
    } else if (currentStatus === 'PAUSED') {
      newStatus = 'ACTIVE';
    } else {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        `Cannot toggle status. Listing is currently ${currentStatus}. This action is only allowed for ACTIVE or PAUSED listings.`,
      );
    }

    return await this.prisma.listing.update({
      where: { id },
      data: { status: newStatus },
    });
  }

  /**
   * Delete a listing (Cascade Delete)
   * Only the owner can delete their own listing, and only if not SOLD/EXCHANGED
   */
  async remove(id: string, userId: string, role?: Role) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { owner: true, files: true },
    });

    if (!listing) throw new ApiError(HttpStatus.NOT_FOUND, 'Listing not found');
    if (role === Role.CUSTOMER && listing.owner.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, 'You can only delete your own listings');
    }

    // 1. Condition: Cannot delete if already SOLD or EXCHANGED
    if (listing.status === 'SOLD' || listing.status === 'EXCHANGED') {
      throw new ApiError(
        HttpStatus.BAD_REQUEST,
        `Cannot delete a listing that is already ${listing.status}`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 2. Cascade Delete: Files from Storage
      if (listing.files && listing.files.length > 0) {
        for (const file of listing.files) {
          if (file.url && file.key) {
            await this.fileService.autoDelete(file.url, file.key);
          }
        }
      }

      // 3. Cascade Delete: Related Database Records
      // We explicitly delete these to ensure a clean purge across models
      await tx.watchlist.deleteMany({ where: { listingId: id } });
      await tx.starredListing.deleteMany({ where: { listingId: id } });
      await tx.listingShare.deleteMany({ where: { listingId: id } });
      await tx.collectionListing.deleteMany({ where: { listingId: id } });
      await tx.priceCalculationLog.deleteMany({ where: { listingId: id } });
      await tx.listingHistory.deleteMany({ where: { listingId: id } });
      await tx.file.deleteMany({ where: { listingId: id } });

      // 4. Finally delete the listing itself
      return await tx.listing.delete({
        where: { id },
      });
    });
  }
}
