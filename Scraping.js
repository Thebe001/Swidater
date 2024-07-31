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
