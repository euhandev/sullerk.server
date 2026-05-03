export const moduleTemplate = ({
  pascal,
  kebab,
}) => `import { Module } from '@nestjs/common';
import { ${pascal}Service } from './${kebab}.service';
import { ${pascal}Controller } from './${kebab}.controller';

@Module({
  controllers: [${pascal}Controller],
  providers: [${pascal}Service],
})
export class ${pascal}Module {}
`;
