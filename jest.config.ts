import type { Config } from 'jest';

const config: Config = {
  automock: false,
  transform: {
    '\\.ts$': 'ts-jest',
  },
};

export default config;
