import { Express } from 'express';
import { Server } from 'http';
import { startServer } from 'src/start-server';

export class RestServerTestbed implements AsyncDisposable {
  public readonly server: Server;
  public readonly app: Express;
  public readonly port: number;

  constructor(args: { server: Server; app: Express; port: number }) {
    this.server = args.server;
    this.app = args.app;
    this.port = args.port;
  }

  public static async create(args: { intialPort: number }) {
    const {
      server,
      app,
      port: availablePort,
    } = await this.createServerWithAvailablePort(args.intialPort);
    return new RestServerTestbed({
      app,
      server,
      port: availablePort,
    });
  }

  private static async createServerWithAvailablePort(initialPort: number) {
    let port = initialPort;
    const maxAttempts = 100;
    let attempt = 0;

    while (attempt < maxAttempts) {
      try {
        const { server, app } = await startServer({
          port,
          envType: 'test',
          logGreeting: false,
        });
        return { server, app, port };
      } catch (error: unknown) {
        if (
          error instanceof Error &&
          (('code' in error && error.code === 'EADDRINUSE') ||
            error.message?.includes('EADDRINUSE'))
        ) {
          attempt++;
          port++;
          if (attempt >= maxAttempts) {
            throw new Error(
              `Failed to find an available port after trying ${maxAttempts} ports starting from ${initialPort}`,
            );
          }
          continue;
        }
        throw error;
      }
    }

    throw new Error(
      `Failed to find an available port after trying ${maxAttempts} ports starting from ${initialPort}`,
    );
  }

  public async [Symbol.asyncDispose](): Promise<void> {
    await this.dispose();
  }

  public async dispose() {
    return new Promise<void>((resolve) => {
      this.server.close(async () => {
        resolve();
      });
    });
  }
}
