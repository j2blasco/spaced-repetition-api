import type { Boundaries } from '@j2blasco/ts-boundaries';

const boundaries: Boundaries = {
  name: 'rest',
  internal: ['environment', 'common'],
  external: ['express', 'cors'],
};

export default boundaries;
