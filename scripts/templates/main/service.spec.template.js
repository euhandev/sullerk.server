export const serviceSpecTemplate = ({
  pascal,
  kebab,
}) => `import { Test, TestingModule } from '@nestjs/testing';
import { ${pascal}Service } from './${kebab}.service';

describe('${pascal}Service', () => {
  let service: ${pascal}Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [${pascal}Service],
    }).compile();

    service = module.get<${pascal}Service>(${pascal}Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
`;
