import { DependencyInjector } from 'src/services/injector/injector';

export function registerDependencyInjectionProviders() {
  DependencyInjector.clear();
}
