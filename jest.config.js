module.exports = {
  preset: 'ts-jest',
  roots: [
      'src'
  ],
  testEnvironment: 'node',
  reporters: [
    "default",
    ["./node_modules/jest-html-reporter", {
      "pageTitle": "测试报告",
      "includeConsoleLog": true,
      "theme": "lightTheme",
      "useCssFile": true,
      "styleOverridePath": "./reporter/reporter.css",
      "customScriptPath": "./reporter/reporter.js"
    }]
  ],
  setupFiles: [
    "<rootDir>/src/test/setup.ts"
  ],
  verbose: true
};
