<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/626d9853-0329-420d-89f0-0de4a7923942

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## VS Code IDE Integration

If you want Command Code integration in VS Code, install the Command Code CLI globally and use the built-in workspace tasks:

- `npm i -g command-code@latest`
- `cmd --ide-setup` to initialize the IDE extension connection
- `cmd` to start a Command Code session in your project

You can also run the tasks from VS Code via `Terminal > Run Task...` and choose:

- `Command Code: IDE Setup`
- `Command Code: Start Session`

For interactive reconnection diagnostics from within a Command Code session, run `/ide`.
