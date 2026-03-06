const express = require("express");
const path = require("path");

const statsRoute = require("./routes/stats.route");
const calendarRoute = require("./routes/calendar.route");
const pingRoute = require("./routes/ping.route");
const rssRoute = require("./routes/rss.route");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/stats", statsRoute);
app.use("/api/calendar/events", calendarRoute);
app.use("/api/ping", pingRoute);
app.use("/api/rss", rssRoute);

module.exports = app;
