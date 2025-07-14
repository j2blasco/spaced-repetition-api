import * as fs from 'fs';
import * as crypto from 'crypto';

// Note: random key generator at https://generate-random.org/encryption-key-generator?count=1&bytes=16&cipher=aes-128-cbc&string=&password=

const ALGORITHM = 'aes-128-cbc';
export const KEY_LENGTH = 16;
const IV_LENGTH = 16;

const MARKER = Buffer.from('ENCRYPTED');

export function encryptFile(
  inputPath: string,
  outputPath: string,
  key: string,
): void {
  const input = fs.readFileSync(inputPath);
  const marker = input.subarray(0, MARKER.length);
  if (marker.equals(MARKER)) {
    return;
  }

  const keyBuffer = Buffer.from(key, 'utf-8').subarray(0, KEY_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  const encrypted = Buffer.concat([
    MARKER,
    iv,
    cipher.update(input),
    cipher.final(),
  ]);

  fs.writeFileSync(outputPath, encrypted);
}

export function decryptFile(
  inputPath: string,
  outputPath: string,
  key: string,
): void {
  try {
    const keyBuffer = Buffer.from(key, 'utf-8').subarray(0, KEY_LENGTH);
    const input = fs.readFileSync(inputPath);

    const marker = input.subarray(0, MARKER.length);
    if (!marker.equals(MARKER)) {
      fs.writeFileSync(outputPath, input);
      return;
    }

    const iv = input.subarray(MARKER.length, MARKER.length + IV_LENGTH);
    const encryptedText = input.subarray(MARKER.length + IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    fs.writeFileSync(outputPath, decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
  }
}
