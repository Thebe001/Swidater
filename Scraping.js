const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { Parser } = require("json2csv");

const basePath = "C:/Users/slim/Downloads/srg2024";
const booksPath = path.join(basePath, "books");

// Function to get subdirectories within a directory
function getSubDirectories(dirPath) {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
  } catch (error) {
    console.error("Error reading subdirectories:", error);
    return [];
  }
}

// Function to scrape data from a page
async function scrapePage(page) {
  try {
    return await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('td[valign="middle"]'));
      return tds
        .filter((td) => td.querySelector("img"))
        .map((td) => ({
          name: td.querySelector("a").innerText.trim(),
          type: td.querySelector("img").src.trim(),
          link: td.querySelector("a").href.trim(),
        }));
    });
  } catch (error) {
    console.error("Error scraping page:", error);
    return [];
  }
}

// Function to scrape specific elements from a page
async function scrapeElement(page, type) {
  try {
    return await page.evaluate((type) => {
      const elements = Array.from(document.querySelectorAll(type));
      return elements.map((e) => e.innerText.trim()); // Trim to clean data
    }, type);
  } catch (error) {
    console.error(`Error scraping ${type}:`, error);
    return [];
  }
}

// Function to handle parallel scraping
async function scrapePageParallel(browser, filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return [];
  }

  const page = await browser.newPage();
  await page.goto(`file://${filePath}`, { waitUntil: "domcontentloaded" });

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const results = await scrapePage(page);
  const allResults = [];

  for (const result of results) {
    const page2 = await browser.newPage();
    await page2.goto(result.link);

    let data = [];
    if (result.type.includes("inserted.gif")) {
      const insertions = await scrapeElement(page2, "ins");
      data = insertions.map((insertion) => ({
        name: result.name.trim(),
        type: "Insertion",
        content: insertion,
        path: filePath // Add file path to each entry
      }));
    }
    if (result.type.includes("deleted.gif")) {
      const deletions = await scrapeElement(page2, "del");
      data = deletions.map((deletion) => ({
        name: result.name.trim(),
        type: "Deletion",
        content: deletion,
        path: filePath // Add file path to each entry
      }));
    }

    allResults.push(...data);
    await page2.close();
  }

  await page.close();
  return allResults;
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const allResults = [];
  const subDirs = getSubDirectories(booksPath);
  const filePaths = subDirs.map((subDir) =>
    path.join(booksPath, subDir, "httoc.htm")
  );

  try {
    const promises = filePaths.map((filePath) => scrapePageParallel(browser, filePath));
    const resultsArray = await Promise.all(promises);

    resultsArray.forEach((results) => {
      allResults.push(...results);
    });

    // Sort results by name and type
    allResults.sort((a, b) => a.name.localeCompare(b.name) || a.type.localeCompare(b.type));

    // Define the columns for CSV including 'path'
    const fields = ['name', 'type', 'content', 'path'];
    const json2csvParser = new Parser({ fields });
    const csvData = json2csvParser.parse(allResults);

    // Save to CSV file
    const outputFilePath = path.join(__dirname, 'scraped_data.csv');
    fs.writeFileSync(outputFilePath, csvData);

    console.log(`CSV file saved to ${outputFilePath}`);
  } catch (error) {
    console.error("Error scraping pages:", error);
  } finally {
    await browser.close();
  }
})();
