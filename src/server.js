const app = require("./app");

const PORT = 6767;

app.listen(PORT, () => {
  console.log(`Server Dashboard running at http://localhost:${PORT}`);
});
