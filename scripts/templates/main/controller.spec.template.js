export const controllerSpecTemplate = ({
  pascal,
  kebab,
}) => `import { Test, TestingModule } from '@nestjs/testing';
import { ${pascal}Controller } from './${kebab}.controller';
import { ${pascal}Service } from './${kebab}.service';

describe('${pascal}Controller', () => {
  let controller: ${pascal}Controller;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [${pascal}Controller],
      providers: [${pascal}Service],
    }).compile();

    controller = module.get<${pascal}Controller>(${pascal}Controller);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
`;
