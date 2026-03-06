const ical = require("node-ical");

const fetchEvents = async (req, res) => {
  const { feeds } = req.body;
  if (!feeds || !Array.isArray(feeds) || feeds.length === 0) {
    return res.json([]);
  }

  try {
    const allEvents = [];
    const now = new Date();
    const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    await Promise.all(
      feeds.map(async (feed) => {
        try {
          const data = await ical.async.fromURL(feed.url);
          for (const key of Object.keys(data)) {
            const ev = data[key];
            if (ev.type !== "VEVENT") continue;

            const start = new Date(ev.start);
            const end = ev.end ? new Date(ev.end) : start;

            if (end >= rangeStart && start <= rangeEnd) {
              allEvents.push({
                title: ev.summary || "Untitled",
                start: start.toISOString(),
                end: end.toISOString(),
                location: ev.location || null,
                description: ev.description
                  ? ev.description.substring(0, 200)
                  : null,
                allDay:
                  ev.start && ev.start.dateOnly !== undefined
                    ? ev.start.dateOnly
                    : false,
                feedName: feed.name,
                feedColor: feed.color,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching feed ${feed.name}:`, err.message);
        }
      }),
    );

    allEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    res.json(allEvents);
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
};

module.exports = {
  fetchEvents,
};
