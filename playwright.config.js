"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
exports.default = (0, test_1.defineConfig)({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:50000', // Your Hapi.js server URL
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: Object.assign({}, test_1.devices['Desktop Chrome']),
        },
    ],
});
