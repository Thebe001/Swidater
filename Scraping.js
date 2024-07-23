const puppeteer = require("puppeteer");
var path = require("path");
const fs = require("fs");
const { Cluster } = require("puppeteer-cluster");
const basePath = "C:/Users/Ahmed/Downloads/srg2024";
const booksPath = path.join(basePath, "books");
function getSubDirectories(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}
const BookSubDirs = getSubDirectories(booksPath);
const mainFilePath = "file://" + path + "index.htm";
const filePaths = BookSubDirs.map((usm) =>
  path.join(booksPath, usm, "index.htm")
);

(async () => {
  const cluster = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 100,
  });
  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  try {
    await cluster.task(async ({ page, data: path }) => {
      await page.goto(path);
      // Store screenshot, do something else
    });
    for (const path of filePaths) {
      if (fs.existsSync(path)) {
        cluster.queue(path);
      }
    }
    await cluster.idle();
    await cluster.close();
  } catch (error) {
    console.error("Error navigating to file:", error);
  } finally {
    // await browser.close();
  }
})();
