import { registerProviders as registerDependencyInjectionProvidersAlpha } from './providers-alpha';
import { registerProviders as registerDependencyInjectionProvidersBeta } from './providers-beta';
import { registerProviders as registerDependencyInjectionProvidersProd } from './providers-prod';
import { registerProviders as registerDependencyInjectionProvidersTest } from './providers-test';

export function registerProviders(envType: string) {
  switch (envType) {
    case 'alpha':
      registerDependencyInjectionProvidersAlpha();
      return;
    case 'beta':
      registerDependencyInjectionProvidersBeta();
      return;
    case 'prod':
      registerDependencyInjectionProvidersProd();
      return;
    case 'test':
      registerDependencyInjectionProvidersTest();
      return;
    default:
      throw new Error(`[registerProviders] Invalid env type: ${envType}`);
  }
}
