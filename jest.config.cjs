/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
  preset: 'ts-jest/presets/default',
  clearMocks: true,
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { useESM: false }],
  },
  moduleFileExtensions: ['js', 'ts', 'tsx', 'json'],
});
