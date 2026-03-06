const express = require("express");
const Parser = require("rss-parser");
const router = express.Router();

const parser = new Parser();

router.get("/", async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL" });
    const feed = await parser.parseURL(targetUrl);

    let items = feed.items.slice(0, 10);

    const anilistItems = [];
    items.forEach((item) => {
      const match =
        item.link && item.link.match(/anilist\.co\/(anime|manga)\/(\d+)/);
      if (match) {
        const type = match[1].toUpperCase();
        const id = parseInt(match[2]);
        anilistItems.push({ id, type, item });
      }
    });

    if (anilistItems.length > 0) {
      try {
        const animes = anilistItems
          .filter((i) => i.type === "ANIME")
          .map((i) => i.id);
        const mangas = anilistItems
          .filter((i) => i.type === "MANGA")
          .map((i) => i.id);

        let mergedMedia = [];

        const fetchMedia = async (ids, type) => {
          if (ids.length === 0) return;
          const graphqlQuery = {
            query: `query ($idIn: [Int]) {
              Page(page: 1, perPage: 50) {
                media(id_in: $idIn, type: ${type}) {
                  id
                  type
                  title {
                    english
                    romaji
                  }
                  coverImage {
                    large
                  }
                }
              }
            }`,
            variables: { idIn: ids },
          };

          const aniRes = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(graphqlQuery),
          });

          if (aniRes.ok) {
            const aniData = await aniRes.json();
            if (aniData.data?.Page?.media) {
              mergedMedia = mergedMedia.concat(aniData.data.Page.media);
            }
          }
        };

        await fetchMedia(animes, "ANIME");
        await fetchMedia(mangas, "MANGA");

        const mediaMap = {};
        mergedMedia.forEach((m) => {
          mediaMap[m.id] = {
            coverImage: m.coverImage?.large,
            title: m.title?.english || m.title?.romaji,
          };
        });

        items.forEach((item) => {
          const itemMatch = anilistItems.find((i) => i.item === item);
          if (itemMatch && mediaMap[itemMatch.id]) {
            item.coverImage = mediaMap[itemMatch.id].coverImage;
            if (mediaMap[itemMatch.id].title) {
              item.title = mediaMap[itemMatch.id].title;
            }
          }
        });
      } catch (gqlErr) {
        console.warn("Failed to fetch AniList covers:", gqlErr);
      }
    }

    res.json(items);
  } catch (error) {
    console.error("RSS parse err:", error);
    res.status(500).json({ error: "Failed to parse RSS." });
  }
});

module.exports = router;
