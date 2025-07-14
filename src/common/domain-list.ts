export interface Domain {
  hostname: string;
  corsEnabled: boolean;
}

export const availableDomains: Domain[] = [
  {
    hostname: 'localhost',
    corsEnabled: true,
  },
  {
    hostname: '127.0.0.1',
    corsEnabled: true,
  },
];
