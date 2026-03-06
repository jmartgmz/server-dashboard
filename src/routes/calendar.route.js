const express = require("express");
const calendarController = require("../controllers/calendar.controller");
const router = express.Router();

router.post("/", calendarController.fetchEvents);

module.exports = router;
