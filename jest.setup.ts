// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window.location globally for all tests
// Use configurable: true so tests can override if needed
if (typeof window !== 'undefined') {
  try {
    delete (window as any).location;
    (window as any).location = {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000',
      protocol: 'http:',
      host: 'localhost:3000',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
    };
  } catch (e) {
    // If we can't delete, try to define
    Object.defineProperty(window, 'location', {
      writable: true,
      configurable: true,
      value: {
        origin: 'http://localhost:3000',
        href: 'http://localhost:3000',
        protocol: 'http:',
        host: 'localhost:3000',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
      },
    });
  }
}
