import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { decryptFile } from './encrypt-file';

const envPathBase = `${__dirname}/env`;

export const SystemEnvType = ['alpha', 'beta', 'prod', 'test'] as const;

export type SystemEnvType = (typeof SystemEnvType)[number];
export function throwIfInvalidEnvType(
  input: string | undefined,
): SystemEnvType {
  const trimmedInput = input?.trim();
  if (SystemEnvType.includes(trimmedInput as SystemEnvType)) {
    return trimmedInput as SystemEnvType;
  }
  throw new Error(`Invalid env type: ${input}`);
}

export function getEnvKeyEnvironmentVariable(envType: SystemEnvType): string {
  return `ENV_${envType.toUpperCase().replace(/-/g, '_')}_KEY`;
}

export async function setSystemEnv(args?: {
  envType: SystemEnvType | undefined;
}) {
  return new Promise<void>(async (resolve, reject) => {
    const envTypeInput = args?.envType ?? process.env.ENV_TYPE ?? '';
    const envType = throwIfInvalidEnvType(envTypeInput);

    const envFileName = `env.${envType}.json`;
    const envPath = `${envPathBase}/${envFileName}`;
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'system-env-'));
    const decryptedEnvPath = path.join(tempDir, envFileName);

    try {
      const key = process.env[getEnvKeyEnvironmentVariable(envType)];
      if (!key) {
        throw new Error(`${getEnvKeyEnvironmentVariable(envType)} is not set`);
      }
      decryptFile(envPath, decryptedEnvPath, key);

      fs.readFile(decryptedEnvPath, 'utf8', (err, data) => {
        if (err) {
          console.error(
            `[System-Env] Error reading file from disk - ${envType}: ${err}`,
          );
          reject(err);
        } else {
          try {
            const envConfig = JSON.parse(data);
            for (const key in envConfig) {
              if (envConfig.hasOwnProperty(key)) {
                process.env[key] = envConfig[key];
              }
            }
            resolve();
          } catch (err) {
            console.error(
              `[System-Env] Error parsing JSON string - ${envType}: ${err}`,
            );
            reject(err);
          }
        }
      });
    } catch (err) {
      console.error(`[System-Env] Error decrypting file - ${envType}: ${err}`);
      reject(err);
    }
  });
}
