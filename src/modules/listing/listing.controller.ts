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
          "teamOrCountry": "Argentina",
          "playerOrManagerName": "Lionel Messi",
          "category": "SHIRT",
          "title": "Signed Manchester United Jersey 2023",
          "seasonOrYear": "2023/24",
          "description": "Authentic signed home shirt.",
          "initialPrice": 500,
          "allowOffers": true,
          "autoPriceAdjust": false,
          "acquiredDate": "2024-05-01",
          "photos": [
            { "fileId": "69fae180e0c772d77befd5b8", "url": "http://localhost:8989/api/v1/files/img1.webp" },
            { "fileId": "69fae180e0c772d77befd5b9", "url": "http://localhost:8989/api/v1/files/img2.webp" }
          ],
          "proofPhoto": [
            { "fileId": "69fae210e0c772d77befd5b9", "url": "http://localhost:8989/api/v1/files/proof.webp" }
          ],
          "proofVideo": [
            { "fileId": "69fae440e0c772d77befd5d5", "url": "http://localhost:8989/api/v1/files/signing_video.mp4" }
          ],
          "coaFile": [
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
          teamOrCountry: 'Argentina',
          playerOrManagerName: 'Lionel Messi',
          category: 'SHIRT',
          seasonOrYear: '2023/24',
          description: 'Authentic signed home shirt.',
          initialPrice: 450,
          allowOffers: true,
          autoPriceAdjust: false,
          acquiredDate: '2023-01-01',
          photos: [
            {
              fileId: '69fae180e0c772d77befd5b8',
              url: 'http://localhost:8989/api/v1/files/img1.webp',
            },
            {
              fileId: '69fae180e0c772d77befd5b9',
              url: 'http://localhost:8989/api/v1/files/img2.webp',
            },
          ],
          proofPhoto: [
            {
              fileId: '69fae210e0c772d77befd5b9',
              url: 'http://localhost:8989/api/v1/files/proof.webp',
            },
          ],
          proofVideo: [
            {
              fileId: '69fae440e0c772d77befd5d5',
              url: 'http://localhost:8989/api/v1/files/signing_video.mp4',
            },
          ],
          coaFile: [
            {
              fileId: '69fae330e0c772d77befd5c1',
              url: 'http://localhost:8989/api/v1/files/coa.pdf',
            },
          ],
          title: 'Signed Manchester United Jersey 2023',
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
}
