// import { FileFieldsInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import { existsSync, mkdirSync } from 'fs';

// export const CustomFileFieldsInterceptor = (
//   fields: { name: string; maxCount?: number }[],
//   uploadPath: string = 'tmp',
// ) => {
//   // Ensure the uploadPath exists
//   if (!existsSync(uploadPath)) {
//     mkdirSync(uploadPath, { recursive: true }); // Create it recursively
//   }

//   return FileFieldsInterceptor(fields, {
//     storage: diskStorage({
//       destination: (req, file, cb) => {
//         cb(null, uploadPath);
//       },
//       filename: (req, file, callback) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         const ext = extname(file.originalname);
//         callback(null, `${uniqueSuffix}${ext}`);
//       },
//     }),
//   });
// };

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { tmpdir } from 'os';
import { extname, join } from 'path';

export const CustomFileFieldsInterceptor = (
  fields: { name: string; maxCount?: number }[],
  uploadPath?: string, // optional
) => {
  const path = uploadPath || join(tmpdir(), ''); // fallback to system tmp dir

  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }

  return FileFieldsInterceptor(fields, {
    storage: diskStorage({
      destination: (req, file, cb) => {
        cb(null, path);
      },
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${uniqueSuffix}${ext}`);
      },
    }),
  });
};
