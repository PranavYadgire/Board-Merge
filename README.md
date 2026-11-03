# Board Merge — Trello Power-Up Frontend

A React + Vite frontend for the Board Merge guided flow, based on the provided Board Merge wireframes and the Mention Groups project scaffold.

## Project structure

```text
board-merge/
├── index.html                 # Standalone wizard/demo
├── powerup.html               # Power-Up connector entry
├── package.json
├── vite.config.js
├── public-icon.svg
└── src/
    ├── main.jsx               # React application bootstrap
    ├── styles.css             # Responsive UI styling
    ├── screens/
    │   └── App.jsx             # Wizard steps and Help & Support UI
    ├── components/             # Reusable component location
    ├── lib/                    # Trello integration/data adapters location
    └── powerup/
        └── main.js              # Trello board-button callback
```

## Run locally

Requires Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the Vite URL. The standalone frontend runs with sample boards and lists, enabling the full wizard interaction without Trello credentials.

## Build

```bash
npm run build
npm run preview
```

## Frontend included

- Source/destination board selectors and board preview metrics
- Five-stage stepper
- List inclusion/exclusion with select-all
- Destination list mapping controls
- Confirmation page and merge summary metrics
- Simulated progress view
- Successful, partial-error and failed completion states (retry affordance)
- Help & Support page with workflow steps and expandable FAQs
- Responsive layout for Power-Up popup sizes

## Trello setup notes

The connector callback in `src/powerup/main.js` is a frontend scaffold. To deploy as a real Power-Up, configure a Trello Power-Up in the Atlassian admin portal, set the connector URL to the hosted Power-Up page, configure allowed origins, and add the necessary capabilities. The current merge behavior is demo UI only: the board/list sample data and completion states are local and do not call Trello APIs or move actual cards. Implement authenticated Trello API operations in `src/lib/` before production use.
