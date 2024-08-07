const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Configuration des chemins
const basePath = "C:/Users/Ahmed/Downloads/srg2024";
const booksPath = path.join(basePath, "books");

// Fonction pour obtenir les sous-répertoires dans un répertoire
function getSubDirectories(dirPath) {
  try {
    return fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name);
  } catch (error) {
    console.error("Erreur lors de la lecture des sous-répertoires :", error);
    return [];
  }
}

// Fonction pour scraper les données d'une page
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
    console.error("Erreur lors du scraping de la page :", error);
    return [];
  }
}

// Fonction pour scraper des éléments spécifiques d'une page
async function scrapeElement(page, type) {
  try {
    return await page.evaluate((type) => {
      const elements = Array.from(document.querySelectorAll(type));
      return elements.map((e) => e.innerText.trim()); // Nettoyer les données
    }, type);
  } catch (error) {
    console.error(`Erreur lors du scraping de ${type} :`, error);
    return [];
  }
}

// Fonction pour scraper les mises à jour d'un tableau
async function scrapeUpdates(page, filePath) {
  try {
    return await page.evaluate((filePath) => {
      const updates = [];
      const tables = Array.from(document.querySelectorAll("table"));

      tables.forEach((table) => {
        const caption = table.querySelector("caption") ? table.querySelector("caption").innerText.trim() : "No Caption";
        const previousH2 = table.previousElementSibling ? table.previousElementSibling.innerText.trim() : "No H2";

        // Trouver les lignes modifiées
        const rows = Array.from(table.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          let delContent = "";
          let insContent = "";
          cells.forEach((cell, index) => {
            if (cell.querySelector("ins") || cell.querySelector("del")) { // Vérifier les cellules mises à jour
              delContent += Array.from(cell.querySelectorAll("del")).map(del => del.innerText.trim()).join(" ");
              insContent += Array.from(cell.querySelectorAll("ins")).map(ins => ins.innerText.trim()).join(" ");
            }
          });

          if (delContent) {
            updates.push({
              name: caption,
              type: "Before Update",
              content: `${previousH2} ${delContent}`.trim(),
              path: filePath
            });
          }

          if (insContent) {
            updates.push({
              name: caption,
              type: "After Update",
              content: `${previousH2} ${insContent}`.trim(),
              path: filePath
            });
          }
        });
      });

      // Scraper les paragraphes H3 avec le premier H2 précédent
      const h3s = Array.from(document.querySelectorAll("h3"));
      h3s.forEach((h3) => {
        let previousH2 = h3.previousElementSibling;
        while (previousH2 && previousH2.tagName !== "H2") {
          previousH2 = previousH2.previousElementSibling;
        }
        if (previousH2 && previousH2.tagName === "H2") {
          const delContent = Array.from(h3.querySelectorAll("del")).map(del => del.innerText.trim()).join(" ");
          const insContent = Array.from(h3.querySelectorAll("ins")).map(ins => ins.innerText.trim()).join(" ");

          if (delContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update1.1",
              content: `${previousH2.innerText.trim()}\n${h3.innerText.trim().replace(delContent, "").trim()}`,
              path: filePath
            });
          }

          if (insContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update1.2",
              content: `${previousH2.innerText.trim()}\n${h3.innerText.trim().replace(insContent, "").trim()}`,
              path: filePath
            });
          }

          // Si le paragraphe contient à la fois des balises <ins> et <del>
          if (delContent && insContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update1.1",
              content: `${previousH2.innerText.trim()}\n${h3.innerText.trim().replace(delContent, "").trim()}`,
              path: filePath
            });
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update1.2",
              content: `${previousH2.innerText.trim()}\n${h3.innerText.trim().replace(insContent, "").trim()}`,
              path: filePath
            });
          }
        }
      });

      // Scraper les paragraphes H4 avec le premier H2 et H3 précédents
      const h4s = Array.from(document.querySelectorAll("h4"));
      h4s.forEach((h4) => {
        let previousH2 = h4.previousElementSibling;
        let previousH3 = null;
        while (previousH2 && previousH2.tagName !== "H2") {
          if (previousH2.tagName === "H3") {
            previousH3 = previousH2;
          }
          previousH2 = previousH2.previousElementSibling;
        }
        if (previousH2 && previousH2.tagName === "H2" && previousH3 && previousH3.tagName === "H3") {
          const delContent = Array.from(h4.querySelectorAll("del")).map(del => del.innerText.trim()).join(" ");
          const insContent = Array.from(h4.querySelectorAll("ins")).map(ins => ins.innerText.trim()).join(" ");

          if (delContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update2.1",
              content: `${previousH2.innerText.trim()}\n${previousH3.innerText.trim()}\n${h4.innerText.trim().replace(delContent, "").trim()}`,
              path: filePath
            });
          }

          if (insContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update2.2",
              content: `${previousH2.innerText.trim()}\n${previousH3.innerText.trim()}\n${h4.innerText.trim().replace(insContent, "").trim()}`,
              path: filePath
            });
          }

          // Si le paragraphe contient à la fois des balises <ins> et <del>
          if (delContent && insContent) {
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update2.1",
              content: `${previousH2.innerText.trim()}\n${previousH3.innerText.trim()}\n${h4.innerText.trim().replace(delContent, "").trim()}`,
              path: filePath
            });
            updates.push({
              name: previousH2.innerText.trim(),
              type: "Update2.2",
              content: `${previousH2.innerText.trim()}\n${previousH3.innerText.trim()}\n${h4.innerText.trim().replace(insContent, "").trim()}`,
              path: filePath
            });
          }
        }
      });

      return updates;
    }, filePath);
  } catch (error) {
    console.error("Erreur lors du scraping des mises à jour du tableau :", error);
    return [];
  }
}

// Fonction pour gérer le scraping parallèle
async function scrapePageParallel(browser, filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Fichier non trouvé : ${filePath}`);
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
        path: filePath
      }));
    }
    if (result.type.includes("deleted.gif")) {
      const deletions = await scrapeElement(page2, "del");
      data = deletions.map((deletion) => ({
        name: result.name.trim(),
        type: "Deletion",
        content: deletion,
        path: filePath
      }));
    }

    const updates = await scrapeUpdates(page2, filePath);
    allResults.push(...data, ...updates);
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

    // Vérification des résultats obtenus
    console.log("Nombre total de résultats:", allResults.length);
    console.log("Exemples de résultats:", allResults.slice(0, 5));

    // Trier les résultats par nom, type, contenu et chemin
    allResults.sort((a, b) => {
      const nameComparison = a.name.localeCompare(b.name);
      if (nameComparison !== 0) return nameComparison;

      const typeComparison = a.type.localeCompare(b.type);
      if (typeComparison !== 0) return typeComparison;

      const contentComparison = a.content.localeCompare(b.content);
      if (contentComparison !== 0) return contentComparison;

      return a.path.localeCompare(b.path);
    });

    // Sauvegarde des résultats dans un fichier Excel
    const worksheet = xlsx.utils.json_to_sheet(allResults);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Results");

    const outputPath = path.join(basePath, "results.xlsx");
    xlsx.writeFile(workbook, outputPath);

    console.log("Résultats sauvegardés dans", outputPath);
  } catch (error) {
    console.error("Erreur lors du scraping des pages :", error);
  } finally {
    await browser.close();
    await browser.close();
  }
})();