const express = require("express");
const rssController = require("../controllers/rss.controller");
const router = express.Router();

router.get("/", rssController.fetchRss);

module.exports = router;
