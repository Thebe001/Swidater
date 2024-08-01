const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const basePath = "C:/Users/Ahmed/Downloads/srg2024";
const booksPath = path.join(basePath, "books");

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

async function scrapePage(page) {
  try {
    return await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('td[valign="middle"]'));

      return tds
        .filter((td) => td.querySelector("img"))
        .map((td) => {
          return {
            name: td.querySelector("a").innerText.trim(),
            type: td.querySelector("img").src.trim(),
            link: td.querySelector("a").href.trim(),
          };
        });
    });
  } catch (error) {
    console.error("Error scraping page:", error);
    return [];
  }
}

async function scrapeElement(page, type) {
  try {
    return await page.evaluate((type) => {
      const elements = Array.from(document.querySelectorAll(type));
      if (elements) {
        return elements.map((e) => e.innerText);
      } else {
        return [];
      }
    }, type);
  } catch (error) {
    console.error(`Error scraping ${type}:`, error);
    return [];
  }
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });

  try {
    const subDirs = getSubDirectories(booksPath);
    const filePaths = subDirs.map((subDir) =>
      path.join(booksPath, subDir, "httoc.htm")
    );

    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const page = await browser.newPage();
        await page.goto(`file://${filePath}`, { waitUntil: "networkidle2" });

        const results = await scrapePage(page);
        //console.log(`From ${filePath}:`);

        let i = 0;
        for (const result of results) {
          const page2 = await browser.newPage();
          await page2.goto(result.link);
          if (result.type.includes("inserted.gif")) {
            const insertions = await scrapeElement(page2, "ins");
            for (const insertion of insertions) {
              console.log(`INSERTION ${i} \n ${insertion}\n`);
            }
          }
          if (result.type.includes("deleted.gif")) {
            const deletions = await scrapeElement(page2, "del");
            for (const deletion of deletions) {
              console.log(`DELETION ${i} \n ${deletion}\n`);
            }
          }
          if (result.type.includes("updated.gif")) {
          }

          i++;
          await page2.close();
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
