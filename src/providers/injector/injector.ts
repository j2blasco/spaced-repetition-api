/* eslint-disable @typescript-eslint/no-explicit-any */
import { Subject } from 'rxjs';

export class InjectToken<_T> {
  constructor(public readonly name: string) {}
}

export class DependencyInjector {
  private static registeredObjects = new Map<string, any>();
  public static clear$: Subject<void> = new Subject<void>();

  public static register<T>(token: InjectToken<T>, registeredObject: T): void {
    if (this.registeredObjects.has(token.name)) {
      throw new Error(`Service '${token.name}' is already registered.`);
    }
    this.registeredObjects.set(token.name, registeredObject);
  }

  public static inject<T>(token: InjectToken<T>): T {
    const service = this.registeredObjects.get(token.name);
    if (!service) {
      throw new Error(`Service '${token.name}' is not registered.`);
    }
    return service as T;
  }

  public static clear(): void {
    this.clear$.next();
    this.registeredObjects.clear();
  }
}
