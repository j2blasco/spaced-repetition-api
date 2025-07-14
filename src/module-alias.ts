export const distRootPath = __dirname;

export function initModuleAlias() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const moduleAlias = require('module-alias');
  moduleAlias.addAlias('src', distRootPath);
}
