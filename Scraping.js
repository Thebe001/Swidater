/*const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Configuration des chemins
const basePath = "C:/Users/slim/Downloads/srg2024";
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
        path: filePath // Ajouter le chemin du fichier à chaque entrée
      }));
    }
    if (result.type.includes("deleted.gif")) {
      const deletions = await scrapeElement(page2, "del");
      data = deletions.map((deletion) => ({
        name: result.name.trim(),
        type: "Deletion",
        content: deletion,
        path: filePath // Ajouter le chemin du fichier à chaque entrée
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

    // Trier les résultats par nom, type, contenu et chemin
    allResults.sort((a, b) => {
      // Trier par 'name' en premier
      const nameComparison = a.name.localeCompare(b.name);
      if (nameComparison !== 0) return nameComparison;

      // Si les noms sont identiques, trier par 'type'
      const typeComparison = a.type.localeCompare(b.type);
      if (typeComparison !== 0) return typeComparison;

      // Si les types sont identiques, trier par 'content'
      const contentComparison = a.content.localeCompare(b.content);
      if (contentComparison !== 0) return contentComparison;

      // Si les contenus sont identiques, trier par 'path'
      return a.path.localeCompare(b.path);
    });

    // Préparer les données pour Excel
    const worksheetData = [
      ['name', 'type', 'content', 'path'], // En-têtes
      ...allResults.map(row => [row.name, row.type, row.content, row.path])
    ];

    // Créer un nouveau classeur
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Ajouter la feuille de calcul au classeur
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Spécifiez le chemin du fichier Excel
    const outputPath = path.join(__dirname, 'results.xlsx');

    // Écrire dans le fichier Excel
    xlsx.writeFile(workbook, outputPath);

    console.log(`Les résultats ont été écrits dans ${outputPath}`);

  } catch (error) {
    console.error("Erreur lors du scraping des pages :", error);
  } finally {
    await browser.close();
  }
})();
**/
/*
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Configuration des chemins
const basePath = "C:/Users/slim/Downloads/srg2024";
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

        // Find modified rows
        const rows = Array.from(table.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          cells.forEach((cell, index) => {
            if (cell.querySelector("ins") || cell.querySelector("del")) { // Check for updated cell
              const previousCellContent = index > 0 ? cells[index - 1].innerHTML : "";
              const rowContentBefore = row.innerHTML.replace(/<ins>.*?<\/ins>/g, "").replace(/<[^>]*>?/gm, '').trim();
              const rowContentAfter = row.innerHTML.replace(/<del>.*?<\/del>/g, "").replace(/<[^>]*>?/gm, '').trim();

              updates.push({
                name: caption,
                type: "Before Update",
                content: `${previousH2} ${previousCellContent} ${rowContentBefore}`,
                path: filePath
              });

              updates.push({
                name: caption,
                type: "After Update",
                content: `${previousH2} ${previousCellContent} ${rowContentAfter}`,
                path: filePath
              });
            }
          });
        });
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

    // Préparer les données pour Excel
    const worksheetData = [
      ['name', 'type', 'content', 'path'], // En-têtes
      ...allResults.map(row => [row.name, row.type, row.content, row.path])
    ];

    // Créer un nouveau classeur
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Ajouter la feuille de calcul au classeur
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Spécifiez le chemin du fichier Excel
    const outputPath = path.join(__dirname, 'results.xlsx');

    // Écrire dans le fichier Excel
    xlsx.writeFile(workbook, outputPath);

    console.log(`Les résultats ont été écrits dans ${outputPath}`);

  } catch (error) {
    console.error("Erreur lors du scraping des pages :", error);
  } finally {
    await browser.close();
  }
})();
*/
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");

// Configuration des chemins
const basePath = "C:/Users/slim/Downloads/srg2024";
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

        // Find modified rows
        const rows = Array.from(table.querySelectorAll("tr"));
        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll("td"));
          let delContent = "";
          let insContent = "";
          cells.forEach((cell, index) => {
            if (cell.querySelector("ins") || cell.querySelector("del")) { // Check for updated cell
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

    // Préparer les données pour Excel
    const worksheetData = [
      ['name', 'type', 'content', 'path'], // En-têtes
      ...allResults.map(row => [row.name, row.type, row.content, row.path])
    ];

    // Créer un nouveau classeur
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

    // Ajouter la feuille de calcul au classeur
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Results');

    // Spécifiez le chemin du fichier Excel
    const outputPath = path.join(__dirname, 'results.xlsx');

    // Écrire dans le fichier Excel
    xlsx.writeFile(workbook, outputPath);

    console.log(`Les résultats ont été écrits dans ${outputPath}`);

  } catch (error) {
    console.error("Erreur lors du scraping des pages :", error);
  } finally {
    await browser.close();
  }
})();
