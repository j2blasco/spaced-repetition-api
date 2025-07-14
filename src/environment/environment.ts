import { setSystemEnv, SystemEnvType } from './env/set-system-env';
import { registerDependencyInjectionProviders } from './providers/providers';

export async function setEnvironment(envType: SystemEnvType) {
  process.env.ENV_TYPE = envType;
  await setSystemEnv({ envType });
  return registerDependencyInjectionProviders();
}
