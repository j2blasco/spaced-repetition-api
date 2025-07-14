import { throwIfInvalidEnvType } from '../env/set-system-env';
import { registerDependencyInjectionProviders as registerDependencyInjectionProvidersAlpha } from './registration/providers-alpha';
import { registerDependencyInjectionProviders as registerDependencyInjectionProvidersBeta } from './registration/providers-beta';
import { registerDependencyInjectionProviders as registerDependencyInjectionProvidersProd } from './registration/providers-prod';
import { registerDependencyInjectionProviders as registerDependencyInjectionProvidersTest } from './registration/providers-test';

export function registerDependencyInjectionProviders() {
  const envType = throwIfInvalidEnvType(process.env.ENV_TYPE);
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
      const _exhaustiveCheck: never = envType;
      throw new Error(`[registerProviders] Invalid env type: ${envType}`);
  }
}
