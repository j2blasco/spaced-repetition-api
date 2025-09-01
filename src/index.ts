import { startServer } from './start-server';

startServer({
  envType: 'prod',
  port: 4001,
  logGreeting: true,
});
