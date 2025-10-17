import { envLoader } from './envLoader';

jest.mock('./envLoader', () => ({
  EnvLoader: {
    get: jest.fn().mockReturnValue('mock-value'),
  },
}));
