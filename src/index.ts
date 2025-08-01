import { startServer } from './start-server';

startServer({
  envType: process.env.ENV_TYPE ?? 'test',
  port: process.env.PORT ? parseInt(process.env.PORT) : 4001,
  logGreeting: true,
});
