/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
  preset: 'ts-jest/presets/default-esm',
  clearMocks: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { useESM: true }],
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
});
