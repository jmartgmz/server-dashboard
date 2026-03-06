const express = require("express");
const path = require("path");

const statsRoute = require("./routes/stats");
const calendarRoute = require("./routes/calendar");
const pingRoute = require("./routes/ping");
const rssRoute = require("./routes/rss");

const app = express();
const PORT = 6767;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// API Routes
app.use("/api/stats", statsRoute);
app.use("/api/calendar/events", calendarRoute);
app.use("/api/ping", pingRoute);
app.use("/api/rss", rssRoute);

app.listen(PORT, () => {
  console.log(`Server Dashboard running at http://localhost:${PORT}`);
});
