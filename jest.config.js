module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  /*   projects: [
    {
      displayName: 'projectA',
      testMatch: ['<rootDir>/projectA/.test.js'],
      setupFilesAfterEnv: ['<rootDir>/projectA/setupTests.js'],
    },
    {
      displayName: 'projectB',
      testMatch: ['<rootDir>/projectB/.test.js'],
      setupFilesAfterEnv: ['<rootDir>/projectB/setupTests.js'],
    },
  ], */
};
