import type { Boundaries } from '@j2blasco/ts-boundaries';

const boundaries: Boundaries = {
  name: 'rest',
  internal: [],
  external: [
    'express',
    'cors',
    'supertest',
    'http',
    'rxjs',
    'vitest',
    '@j2blasco/*',
  ],
};

export default boundaries;
