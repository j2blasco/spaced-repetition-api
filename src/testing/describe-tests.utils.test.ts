// TODO: jest equivalent

export type TestType = 'unit' | 'integration' | 'e2e';

function shouldRunTest(_type: TestType): boolean {
  return true;
  // TODO: maybe use an env var instead of a file, it's just a value?
  // switch (type) {
  //   case 'unit':
  //     return testEnvironment.unit;
  //   case 'integration':
  //     return testEnvironment.integration;
  //   case 'e2e':
  //     return testEnvironment.e2e;
  //   default:
  //     return false;
  // }
}

function configureTestTimeout(_type: TestType): void {
  // if (testEnvironment.debuggingEnabled) {
  //   jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  //   return;
  // }
  // switch (type) {
  //   case 'unit':
  //     jasmine.DEFAULT_TIMEOUT_INTERVAL = 100;
  //     break;
  //   case 'integration':
  //     jasmine.DEFAULT_TIMEOUT_INTERVAL = 2500;
  //     break;
  //   case 'e2e':
  //     jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
  //     break;
  //   default:
  //     exhaustiveCheck(type);
  //     throw new Error('Unreachable code');
  // }
}

export function describeTest(
  type: TestType,
  title: string,
  callback: () => void,
) {
  if (!shouldRunTest(type)) {
    return;
  }
  configureTestTimeout(type);
  describe(title, callback);
}

export function fdescribeTest(
  type: TestType,
  title: string,
  callback: () => void,
) {
  if (!shouldRunTest(type)) {
    return;
  }
  configureTestTimeout(type);
  fdescribe(title, callback);
}

export function xdescribeTest(
  _type: TestType,
  _title: string,
  _callback: () => void,
) {}
