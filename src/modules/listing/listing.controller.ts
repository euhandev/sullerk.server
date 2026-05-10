import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  Req,
  HttpStatus,
  Delete,
  Param,
  Get,
  Query,
} from '@nestjs/common';
import { ListingService } from './listing.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateListingResponse, FileUploadResponse } from './dto/listing-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../roles/roles.decorator';
import { Role, FileContext, FileAs } from '@prisma/client';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ResponseService } from '@/utils/response';

@ApiTags('Listings')
@ApiBearerAuth('JWT-auth')
@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all listings with search, filter, and pagination',
    description: `
      Retrieves a paginated list of all active listings.
      Supports searching (searchTerm), filtering (sport, teamOrCountry, category, etc.), and sorting.
    `,
  })
  async findAll(@Req() req: any) {
    const result = await this.listingService.findAll(req);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Listings retrieved successfully',
      meta: result.meta,
      data: result.data,
    });
  }

  @Post('upload')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Upload listing media (Step 1)',
    description: `
      Uploads a single media file and records its purpose (PHOTOS, PROOF_PHOTO, PROOF_VIDEO, COA_FILE).
      Returns a detailed file object including its unique database ID and URL.
      
      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/listings/upload" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
        -H "Content-Type: multipart/form-data" \\
        -F "file=@/path/to/image.jpg" \\
        -F "purpose=PHOTOS" \\
        -F "context=CREATE"
      \`\`\`
    `,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The media file to upload',
        },
        purpose: {
          type: 'string',
          enum: ['PHOTOS', 'PROOF_PHOTO', 'PROOF_VIDEO', 'COA_FILE'],
          description: 'Where this file will be used',
        },
        context: {
          type: 'string',
          enum: ['CREATE', 'EDIT'],
          default: 'CREATE',
          description: 'Operational context of upload',
        },
      },
      required: ['file', 'purpose'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    type: FileUploadResponse,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Body('purpose') purpose: FileAs,
    @Body('context') context: FileContext,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.listingService.uploadMedia(file, purpose, userId, context);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'File uploaded successfully',
      data: [result],
    });
  }

  @Get('estimate-price')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Estimate listing price on-the-fly (GET)',
    description: `
      Calculates the estimated value and price breakdown based on query parameters.
      This route applies the new multiplicative formula and authentication hierarchy:
      1. Derived Proof Type (Both > Photo > Video > None)
      2. Best Authentication (Prof Auth > COA > None)
      3. Additive Trophy Boost
      
      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X GET "http://localhost:8989/api/v1/listings/estimate-price?sport=Football&category=SHIRT&signatureType=FULL&photoProofType=FULL_VIEW&videoProofType=FULL_VIEW&coaStatus=COA_INCLUDED" \\
        -H "Authorization: Bearer YOUR_TOKEN_HERE"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Price estimated successfully',
    schema: {
      example: {
        success: true,
        message: 'Price estimated successfully',
        data: {
          finalPrice: 691,
          breakdown: [
            { label: 'Base Price', value: 200, type: 'BASE' },
            { label: 'Proof Type (PHOTO_VIDEO)', multiplier: 1.8, value: 360, diff: 160 },
            { label: 'Signature (FULL)', multiplier: 1.6, value: 576, diff: 216 },
            { label: 'COA (COA_INCLUDED)', multiplier: 1.2, value: 691.2, diff: 115.2 },
          ],
          platformFee: 35,
          sellerRange: { min: 622, max: 760 },
        },
      },
    },
  })
  async estimatePrice(@Query() dto: CreateListingDto) {
    const result = await this.listingService.estimatePrice(dto);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Price estimated successfully',
      data: result,
    });
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Create a new listing (Step 2)',
    description: `
      Finalizes the listing creation using FileItem objects {fileId, url} from Step 1.
      The system verifies these IDs against the user's uploaded files.
      Unused pending files for this user will be automatically deleted from storage.
      
      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/listings" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
        -H "Content-Type: application/json" \\
        -d '{
          "sport": "Football",
          "league": "Premier League",
          "teamOrCountry": "Manchester United",
          "playerOrManagerName": "Marcus Rashford",
          "category": "SHIRT",
          "title": "Signed Rashford Jersey 2024",
          "seasonOrYear": "2023/24",
          "kitType": "Home",
          "description": "Authentic signed home shirt.",
          "signatureType": "FULL",
          "photoProofType": "FULL_VIEW_ATHLETE",
          "coaStatus": "COA_INCLUDED",
          "companyAuthentication": "PSA",
          "appliedHonours": ["Premier League"],
          "initialPrice": 500,
          "photos": [
            { "fileId": "69fae180e0c772d77befd5b8", "url": "http://localhost:8989/api/v1/files/img1.webp" }
          ],
          "photoProofs": [
            { "fileId": "69fae210e0c772d77befd5b9", "url": "http://localhost:8989/api/v1/files/proof.webp" }
          ],
          "videoProofs": [
            { "fileId": "69fae440e0c772d77befd5d5", "url": "http://localhost:8989/api/v1/files/signing_video.mp4" }
          ],
          "coaFiles": [
            { "fileId": "69fae330e0c772d77befd5c1", "url": "http://localhost:8989/api/v1/files/coa.pdf" }
          ]
        }'
      \`\`\`
    `,
  })
  @ApiBody({
    type: CreateListingDto,
    examples: {
      standard: {
        summary: 'Standard Request with Objects',
        value: {
          sport: 'Football',
          league: 'Premier League',
          teamOrCountry: 'Manchester United',
          playerOrManagerName: 'Marcus Rashford',
          category: 'SHIRT',
          seasonOrYear: '2023/24',
          kitType: 'Home',
          description: 'Authentic signed home shirt.',
          signatureType: 'FULL',
          photoProofType: 'FULL_VIEW_ATHLETE',
          coaStatus: 'COA_INCLUDED',
          companyAuthentication: 'PSA',
          appliedHonours: ['Premier League'],
          initialPrice: 500,
          photos: [
            {
              fileId: '69fae180e0c772d77befd5b8',
              url: 'http://localhost:8989/api/v1/files/img1.webp',
            },
          ],
          photoProofs: [
            {
              fileId: '69fae210e0c772d77befd5b9',
              url: 'http://localhost:8989/api/v1/files/proof.webp',
            },
          ],
          videoProofs: [
            {
              fileId: '69fae440e0c772d77befd5d5',
              url: 'http://localhost:8989/api/v1/files/signing_video.mp4',
            },
          ],
          coaFiles: [
            {
              fileId: '69fae330e0c772d77befd5c1',
              url: 'http://localhost:8989/api/v1/files/coa.pdf',
            },
          ],
          title: 'Signed Rashford Jersey 2024',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Listing created successfully',
    type: CreateListingResponse,
  })
  async create(@Body() createListingDto: CreateListingDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.listingService.create(createListingDto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Listing created successfully',
      data: result,
    });
  }

  @Delete('upload/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Delete a pending file manually',
    description: `
      Removes an uploaded file from both the database and cloud storage.
      Only pending files owned by the current user can be deleted.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X DELETE "http://localhost:8989/api/v1/listings/upload/69fae180e0c772d77befd5b8" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'File deleted successfully',
        data: { success: true },
      },
    },
  })
  async deletePendingFile(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.listingService.deletePendingFile(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'File deleted successfully',
      data: result,
    });
  }

  @Post('star/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Toggle Love/Star status for a listing',
    description: `
      Toggles the favorite status of a listing for the current user.
      Returns { starred: true } if added, { starred: false } if removed.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/listings/star/69fae180e0c772d77befd5b8" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    schema: { example: { success: true, data: { starred: true } } },
  })
  async toggleStar(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.listingService.toggleStar(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: result.starred ? 'Listing starred successfully' : 'Listing unstarred successfully',
      data: result,
    });
  }

  @Post('watchlist/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Toggle Watchlist status for a listing',
    description: `
      Toggles whether a listing is in the user's watchlist.
      Returns { watching: true } if added, { watching: false } if removed.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/listings/watchlist/69fae180e0c772d77befd5b8" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    schema: { example: { success: true, data: { watching: true } } },
  })
  async toggleWatchlist(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.listingService.toggleWatchlist(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: result.watching
        ? 'Listing added to watchlist successfully'
        : 'Listing removed from watchlist successfully',
      data: result,
    });
  }

  @Post('share/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Record a share action for a listing',
    description: `
      Increments the share count for a listing and records the user who shared it.
      A user can only increment the count once.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/listings/share/69fae180e0c772d77befd5b8" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
      \`\`\`
    `,
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { success: true, message: 'Listing shared successfully', data: { success: true } },
    },
  })
  async share(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.listingService.share(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'Listing shared successfully',
      data: result,
    });
  }
}
