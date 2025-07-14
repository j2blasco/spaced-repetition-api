// TODO: jest test
// import * as fs from 'fs';
// import * as crypto from 'crypto';
// import * as path from 'path';
// import * as os from 'os';
// import { encryptFile, decryptFile } from './encrypt-file';
// import { describeTest } from 'testing/describe-tests.utils.test';

// describeTest('unit', 'File Encryption and Decryption', () => {
//   let tempDir: string;
//   const testContent = 'This is a test file.';
//   const key = crypto.randomBytes(16).toString('hex');
//   let inputPath: string;
//   let encryptedPath: string;
//   let decryptedPath: string;

//   beforeEach(() => {
//     tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-'));
//     inputPath = path.join(tempDir, 'test-input.txt');
//     encryptedPath = path.join(tempDir, 'test-encrypted.txt');
//     decryptedPath = path.join(tempDir, 'test-decrypted.txt');
//     fs.writeFileSync(inputPath, testContent);
//   });

//   afterEach(() => {
//     fs.rmSync(tempDir, { recursive: true });
//   });

//   it('should encrypt the file successfully', () => {
//     encryptFile(inputPath, encryptedPath, key);

//     const encryptedContent = fs.readFileSync(encryptedPath);
//     expect(encryptedContent).toBeDefined();
//     expect(encryptedContent.length).toBeGreaterThan(0);
//   });

//   it('should decrypt the file successfully', () => {
//     encryptFile(inputPath, encryptedPath, key);

//     const encryptedContent = fs.readFileSync(encryptedPath, 'utf8');
//     const originalContent = fs.readFileSync(inputPath, 'utf8');
//     expect(encryptedContent).not.toBe(originalContent);

//     decryptFile(encryptedPath, decryptedPath, key);

//     const decryptedContent = fs.readFileSync(decryptedPath, 'utf8');
//     expect(decryptedContent).toBe(originalContent);
//   });

//   it('should not re-encrypt the file if it is already encrypted', () => {
//     encryptFile(inputPath, encryptedPath, key);

//     const firstEncryption = fs.readFileSync(encryptedPath);
//     expect(firstEncryption).toBeDefined();
//     expect(firstEncryption.length).toBeGreaterThan(0);

//     // Attempt to re-encrypt the already encrypted file
//     encryptFile(encryptedPath, encryptedPath, key);

//     const secondEncryption = fs.readFileSync(encryptedPath);
//     expect(secondEncryption).toEqual(firstEncryption);
//   });
// });
