import { registerProviders as registerDependencyInjectionProvidersAlpha } from './registration/providers-alpha';
import { registerProviders as registerDependencyInjectionProvidersBeta } from './registration/providers-beta';
import { registerProviders as registerDependencyInjectionProvidersProd } from './registration/providers-prod';
import { registerProviders as registerDependencyInjectionProvidersTest } from './registration/providers-test';

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
