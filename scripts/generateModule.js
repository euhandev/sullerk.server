/* eslint-disable no-undef */
import fs from 'fs/promises';
import path from 'path';
import { getModulePaths } from './helper/helper.js';
import { controllerTemplate } from './templates/main/controller.template.js';
import { serviceTemplate } from './templates/main/service.template.js';
import { moduleTemplate } from './templates/main/module.template.js';
import { createDtoTemplate } from './templates/dto/create.dto.template.js';
import { updateDtoTemplate } from './templates/dto/update.dto.template.js';
import { entityTemplate } from './templates/entities/entity.template.js';
import { controllerSpecTemplate } from './templates/main/controller.spec.template.js';
import { serviceSpecTemplate } from './templates/main/service.spec.template.js';
import { constantTemplate } from './templates/main/constant.template.js';

async function generateModule() {
  const moduleName = process.argv[2];
  if (!moduleName) {
    console.error('❌ Please provide a module name. Example: npm run cModule Investor');
    process.exit(1);
  }

  const { baseDir, pascal, camel, kebab } = getModulePaths(moduleName);
  const moduleDir = baseDir.replace(/[^\\/]+$/, kebab);

  // Helper to create folder if not exists
  async function ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  await ensureDir(moduleDir);
  const dtoDir = path.join(moduleDir, 'dto');
  const entityDir = path.join(moduleDir, 'entity');
  await ensureDir(dtoDir);
  await ensureDir(entityDir);

  const files = [
    {
      name: `${kebab}.controller.ts`,
      content: controllerTemplate({ pascal, camel, kebab }),
      dir: moduleDir,
    },
    {
      name: `${kebab}.constant.ts`,
      content: constantTemplate({ pascal, camel, kebab }),
      dir: moduleDir,
    },
    {
      name: `${kebab}.service.ts`,
      content: serviceTemplate({ pascal, camel, kebab }),
      dir: moduleDir,
    },
    {
      name: `${kebab}.module.ts`,
      content: moduleTemplate({ pascal, kebab }),
      dir: moduleDir,
    },
    {
      name: `create-${kebab}.dto.ts`,
      content: createDtoTemplate({ pascal }),
      dir: dtoDir,
    },
    {
      name: `update-${kebab}.dto.ts`,
      content: updateDtoTemplate({ pascal, kebab }),
      dir: dtoDir,
    },
    {
      name: `${kebab}.entity.ts`,
      content: entityTemplate({ pascal }),
      dir: entityDir,
    },
    {
      name: `${kebab}.controller.spec.ts`,
      content: controllerSpecTemplate({ pascal, kebab }),
      dir: moduleDir,
    },
    {
      name: `${kebab}.service.spec.ts`,
      content: serviceSpecTemplate({ pascal, kebab }),
      dir: moduleDir,
    },
  ];

  for (const { name, content, dir } of files) {
    const filePath = path.join(dir, name);
    try {
      await fs.access(filePath);
      console.log(`⚠️ Skipped (already exists): ${filePath}`);
    } catch {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`✅ Created: ${filePath}`);
    }
  }
}

generateModule().catch((err) => {
  console.error('❌ Error during generation:', err);
  process.exit(1);
});
