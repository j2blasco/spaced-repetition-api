import express, { Express } from 'express';
import { Server } from 'http';
import { registerProviders } from 'src/providers/providers-registration/providers-test';
import { startRestApiServer } from './rest-server';
import { firstValueFrom, Observable, Subject } from 'rxjs';

export class RestApiTestbed implements Disposable {
  private _server$: Subject<Server> = new Subject<Server>();
  public server$: Observable<Server> = this._server$;
  public app: Express;

  public async waitForServer() {
    return await firstValueFrom(this.server$);
  }

  constructor() {
    this.app = express();
    registerProviders();
    startRestApiServer({ app: this.app, port: 4001 }).then((server) => {
      this._server$.next(server);
    });
  }

  public [Symbol.dispose](): void {
    this.dispose();
  }

  private async dispose() {
    const server = await firstValueFrom(this.server$);
    server.close();
  }
}
