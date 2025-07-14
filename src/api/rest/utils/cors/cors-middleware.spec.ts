// TODO: jest test
// import { describeTest } from 'src/testing/utils/describe-tests.spec';
// import { isAllowedCorsOrigin } from './cors-middleware';

// describeTest('unit', 'isAllowedCorsOrigin', () => {
//   const testCases = [
//     {
//       origin: 'https://allowed.com',
//       expected: true,
//     },
//     {
//       origin: 'https://test.allowed2.com',
//       expected: true,
//     },
//     {
//       origin: 'https://not-allowed.com',
//       expected: false,
//     },
//     {
//       origin: 'https://test.not-allowed2.com',
//       expected: false,
//     },
//     {
//       origin: undefined,
//       expected: true,
//     },
//   ];

//   const testAllowedHostnames = ['allowed.com', 'test.allowed2.com'];

//   testCases.forEach((testCase) => {
//     it(`should return ${testCase.expected} for ${testCase.origin}`, () => {
//       expect(
//         isAllowedCorsOrigin({
//           origin: testCase.origin,
//           allowedHostnames: testAllowedHostnames,
//         }),
//       )
//         .withContext(`Failed for ${testCase.origin}`)
//         .toBe(testCase.expected);
//     });
//   });
// });
