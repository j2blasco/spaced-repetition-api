import type { Boundaries } from '@j2blasco/ts-boundaries';

const boundaries: Boundaries = {
  name: 'environment',
  internal: [],
  external: ['fs', 'os', 'path', 'crypto', 'url'],
};

export default boundaries;
