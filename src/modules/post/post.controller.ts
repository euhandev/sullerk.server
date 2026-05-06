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
import { PostService } from './post.service';
import { CreatePostDto } from './dto/create-post.dto';
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
import { PostFileUploadResponse, CreatePostResponse } from './dto/post-response.dto';

@ApiTags('Posts')
@ApiBearerAuth('JWT-auth')
@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('upload')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Upload post media (Step 1)',
    description: `
      Uploads a single file for a post (PHOTOS, PROOF_PHOTO, etc).
      Returns a detailed file object including its unique database ID and URL.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/posts/upload" \\
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
        file: { type: 'string', format: 'binary', description: 'The media file' },
        purpose: {
          type: 'string',
          enum: ['PHOTOS', 'PROOF_PHOTO', 'PROOF_VIDEO', 'COA_FILE'],
          default: 'PHOTOS',
        },
        context: {
          type: 'string',
          enum: ['CREATE', 'EDIT'],
          default: 'CREATE',
        },
      },
      required: ['file', 'purpose'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'File uploaded successfully',
    type: PostFileUploadResponse,
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(
    @UploadedFile() file: any,
    @Body('purpose') purpose: FileAs,
    @Body('context') context: FileContext,
    @Req() req: any,
  ) {
    const userId = req.user.id;
    const result = await this.postService.uploadMedia(file, purpose, userId, context);

    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'File uploaded successfully',
      data: [result],
    });
  }

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Create a new post (Step 2)',
    description: `
      Finalizes post creation with description, images, poll, and links.
      The system verifies image IDs against the user's uploaded files.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X POST "http://localhost:8989/api/v1/posts" \\
        -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
        -H "Content-Type: application/json" \\
        -d '{
          "description": "This is a test post with a poll and an image.",
          "images": [
            {
              "fileId": "69fb040e3915f10779259593",
              "url": "http://localhost:8989/api/v1/files/image.webp"
            }
          ],
          "poll": {
            "question": "Which sport is the best?",
            "options": [
              { "text": "Football" },
              { "text": "Basketball" }
            ],
            "multipleChoice": false
          }
        }'
      \`\`\`
    `,
  })
  @ApiBody({
    type: CreatePostDto,
    examples: {
      standard: {
        summary: 'Standard Post with Image and Poll',
        value: {
          description: 'This is a test post with a poll and an image.',
          images: [
            {
              fileId: '69fb040e3915f10779259593',
              url: 'http://localhost:8989/api/v1/files/image.webp',
            },
          ],
          poll: {
            question: 'Which sport is the best?',
            options: [{ text: 'Football' }, { text: 'Basketball' }],
            multipleChoice: false,
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: CreatePostResponse,
  })
  async create(@Body() createPostDto: CreatePostDto, @Req() req: any) {
    const userId = req.user.id;
    const result = await this.postService.create(createPostDto, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.CREATED,
      message: 'Post created successfully',
      data: result,
    });
  }

  @Delete('upload/:id')
  @Roles(Role.CUSTOMER)
  @ApiOperation({
    summary: 'Delete a pending post file',
    description: `
      Removes a pending uploaded file from storage and database.
      Only files owned by the user and marked as pending can be deleted.

      **CURL EXAMPLE:**
      \`\`\`bash
      curl -X DELETE "http://localhost:8989/api/v1/posts/upload/69fb040e3915f10779259593" \\
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
    const result = await this.postService.deletePendingFile(id, userId);
    return ResponseService.formatResponse({
      statusCode: HttpStatus.OK,
      message: 'File deleted successfully',
      data: result,
    });
  }
}
