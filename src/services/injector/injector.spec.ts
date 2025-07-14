// TODO: jets test
// import { describeTest } from 'testing/describe-tests.utils.test';
// import { DependencyInjector, InjectToken } from './injector';

// describeTest('unit', 'DependencyInjector', () => {
//   beforeEach(() => {
//     DependencyInjector.clear();
//   });

//   it('should register and inject a service successfully', () => {
//     const token = new InjectToken<string>('TestService');
//     const serviceValue = 'Injected Service';

//     DependencyInjector.register(token, serviceValue);
//     const injectedService = DependencyInjector.inject(token);

//     expect(injectedService).toBe(serviceValue);
//   });

//   it('should throw an error when registering a service with the same token twice', () => {
//     const token = new InjectToken<string>('TestService');

//     DependencyInjector.register(token, 'First Service');

//     expect(() => {
//       DependencyInjector.register(token, 'Second Service');
//     }).toThrowError(`Service 'TestService' is already registered.`);
//   });

//   it('should throw an error when injecting an unregistered service', () => {
//     const token = new InjectToken<string>('UnregisteredService');

//     expect(() => {
//       DependencyInjector.inject(token);
//     }).toThrowError(`Service 'UnregisteredService' is not registered.`);
//   });

//   it('should handle multiple services with unique tokens', () => {
//     const token1 = new InjectToken<string>('Service1');
//     const token2 = new InjectToken<number>('Service2');
//     const token3 = new InjectToken<boolean>('Service3');

//     DependencyInjector.register(token1, 'Service 1 Value');
//     DependencyInjector.register(token2, 42);
//     DependencyInjector.register(token3, true);

//     expect(DependencyInjector.inject(token1)).toBe('Service 1 Value');
//     expect(DependencyInjector.inject(token2)).toBe(42);
//     expect(DependencyInjector.inject(token3)).toBe(true);
//   });

//   it('should work with complex objects', () => {
//     interface ComplexService {
//       id: number;
//       name: string;
//     }

//     const token = new InjectToken<ComplexService>('ComplexService');
//     const serviceInstance = { id: 1, name: 'Test Complex Service' };

//     DependencyInjector.register(token, serviceInstance);
//     const injectedService = DependencyInjector.inject(token);

//     expect(injectedService).toEqual(serviceInstance);
//   });
// });
