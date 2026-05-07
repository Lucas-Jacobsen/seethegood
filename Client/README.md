# See the Good

A minimal React landing page for a weekly positivity newsletter.

## What changed

- Refactored the landing page into `src/App.js` and `src/App.css`.
- Removed unused direct dependencies for Chakra UI, Material UI, MongoDB, and Express.
- Replaced the old coffee mug logo with a simple sunrise-style mark.
- Kept the existing banner image and reused it in the scroll text-mask animation.
- Simplified the newsletter signup to a frontend-only form for now.
- Added responsive styles for desktop, tablet, and mobile layouts.

## Available scripts

### `npm start`

Runs the app in development mode at [http://localhost:3000](http://localhost:3000).

### `npm run build`

Builds the app for production to the `build` folder.

### `npm test`

Launches the test runner.

## Backend note

The signup form is currently frontend-only. A backend or email platform integration can be added later.
