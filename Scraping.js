const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const basePath = "C:/Users/Ahmed/Downloads/srg2024";
const booksPath = path.join(basePath, "books");

// Function to get subdirectories (assuming these are your book directories)
function getSubDirectories(dirPath) {
  return fs
    .readdirSync(dirPath, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name);
}

// Function to scrape td elements with img inside
async function scrapePage(page) {
  const tdsWithImg = await page.evaluate(() => {
    const tds = Array.from(document.querySelectorAll('td[valign="middle"]'));
    return tds
      .filter((td) => td.querySelector("img")) // Filter tds that contain an img element
      .map((td) => td.querySelector("a").href); // You can adjust this to get specific content or attributes
  });
  return tdsWithImg;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  try {
    const subDirs = getSubDirectories(booksPath);
    const filePaths = subDirs.map((usm) =>
      path.join(booksPath, usm, "httoc.htm")
    );

    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const page = await browser.newPage();
        await page.goto(`file://${filePath}`, { waitUntil: "networkidle2" });

        // Call function to scrape td elements with img inside
        const results = await scrapePage(page);
        console.log(`From ${filePath}:`);
        for (const result of results) {
          const page2 = await browser.newPage();
          await page2.goto(result);
        }

        await page.close();
      } else {
        console.error(`File not found: ${filePath}`);
      }
    }
  } catch (error) {
    console.error("Error scraping pages:", error);
  } finally {
    await browser.close();
  }
})();
