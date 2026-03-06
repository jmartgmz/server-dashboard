# Server Dashboard

A beautiful, lightweight personal server dashboard for Ubuntu, featuring real-time system monitoring, service bookmarks, and an integrated calendar. Inspired by the AniList aesthetic.

## Features

- **Live System Stats**: Real-time monitoring of CPU Load, RAM Usage, Core Temperature, System Uptime, Disk Usage, and Load Average.
- **Service Bookmarks**: Categorized quick-links for your most-used apps and services with live status (Online/Offline) pinging.
- **Calendar Support**: Integrated calendar widget that supports multiple ICS feeds with custom colors and names.
- **Glassmorphism Design**: Modern, premium UI with smooth animations, dark/light mode, and responsive layout.
- **Quick Launch**: Integrated search bar (accessible via `Ctrl+K`) to quickly filter and find services.

## Repository Structure

```text
server-dashboard/
├── src/
│   ├── app.js               # Express application and middlewares
│   ├── server.js            # Server entry point
│   ├── controllers/         # Business logic for endpoints (MVC)
│   └── routes/              # Express API route bindings
├── public/
│   ├── assets/              # Static media: images, icons, etc.
│   ├── css/                 # Stylesheets, broken down into modules
│   ├── js/                  # Vanilla JS frontend scripts
│   └── index.html           # Main dashboard template
└── package.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd server-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Usage

1. **Start the server**:
   ```bash
   npm start
   ```

2. **Access the dashboard**:
   Open your browser and navigate to:
   `http://localhost:6767`

## Customization

- **Port**: Change the `PORT` variable in `server.js` (default is `6767`).
- **Services**: Add or modify your services and bookmarks directly in `public/index.html`.
- **Calendar Feeds**: Manage your ICS feeds directly through the UI by clicking the settings (⚙) icon next to the calendar header.

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML5, CSS3, JavaScript
- **Packages**: `systeminformation` (Stats), `node-ical` (Calendar)
