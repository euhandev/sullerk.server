import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const toPascal = (str) =>
  str.replace(/(^\w|-\w)/g, (match) => match.replace('-', '').toUpperCase());

export const toCamel = (str) => str.charAt(0).toLowerCase() + toPascal(str).slice(1);

export const toKebab = (str) =>
  str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

export const getModulePaths = (moduleName) => {
  const pascal = toPascal(moduleName);
  const camel = toCamel(moduleName);
  const kebab = toKebab(moduleName);

  return {
    baseDir: path.join(__dirname, '..', '..', 'src/modules', kebab),
    pascal,
    camel,
    kebab,
    lower: moduleName.toLowerCase(),
    upper: moduleName.toUpperCase(),
  };
};
