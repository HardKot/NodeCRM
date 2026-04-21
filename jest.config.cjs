/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
  preset: 'ts-jest',
  clearMocks: true,
  testEnvironment: 'node',
});
