const express = require("express");
const pingController = require("../controllers/ping.controller");
const router = express.Router();

router.get("/", pingController.pingService);

module.exports = router;
