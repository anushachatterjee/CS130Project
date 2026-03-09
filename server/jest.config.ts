import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.test.json",
    },
  },
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
setupFiles: ["<rootDir>/src/tests/setup.ts"],
  testTimeout: 30000,
  // Run test files sequentially to avoid DB conflicts
  maxWorkers: 1,
  forceExit: true,
};

export default config;
