# JulesApp - AI Coding Agent Interface

A web application interface for the Jules AI coding agent SDK.

## Features

- **Dashboard**: View and filter coding sessions.
- **Create Session**: Start new coding tasks with GitHub integration or repoless mode.
- **Live Stream**: Monitor agent activity, view plans, code diffs, and terminal output in real-time.
- **Settings**: Configure your Jules API Key.

## Prerequisites

- Node.js 18+
- A valid Jules API Key

## Setup

1. Install dependencies: `npm install`
2. Start the development server: `npm start` (or `dev`)
3. Build for production: `npm run build`

## Note on Browser Compatibility

The `@google/jules-sdk` is primarily designed for Node.js environments. This application uses extensive mocking of Node.js built-in modules (fs, path, crypto, etc.) to allow the SDK to run in the browser.

Functionality that strictly requires local file system access (like running agents on local folders) will not work. However, cloud-based sessions (GitHub sources, Repoless) should function correctly as they rely on API communication.
