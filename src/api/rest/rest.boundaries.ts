import type { Boundaries } from '@j2blasco/ts-boundaries';

const boundaries: Boundaries = {
  name: 'rest',
  internal: [],
  external: ['express', 'cors', 'supertest'],
};

export default boundaries;
