/** @returns {Promise<import('jest').Config>} */
module.exports = async () => ({
  clearMocks: true,
  setupFiles: ['./libs/__test__/jest.setup.js'],
  testEnvironment: 'node',
});
