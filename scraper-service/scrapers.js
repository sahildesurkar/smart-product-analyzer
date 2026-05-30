const axios = require('axios');
const cheerio = require('cheerio');
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

const getRandomAgent = () => agents[Math.floor(Math.random() * agents.length)];

function cleanQuery(query) {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

// =========================================
// ANTI-DETECTION BROWSER CONFIG
// =========================================
function getDriver() {
    const options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--disable-gpu');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments(`user-agent=${getRandomAgent()}`);
    options.addArguments('--disable-blink-features=AutomationControlled');
    
    // Automation flags
    options.excludeSwitches('enable-automation');
    options.setUserPreferences({ 'useAutomationExtension': false });

    return new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();
}

// =========================================
// REMOVE DUPLICATE PRODUCTS
// =========================================
function removeDuplicates(products) {
    const seen = new Set();
    return products.filter(product => {
        const titleKey = product.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const urlKey = product.url.split('?')[0].toLowerCase();
        const key = `${titleKey}-${urlKey}`;
        
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// =========================================
// AMAZON SCRAPER (SELENIUM)
// =========================================
async function scrapeAmazon(query, category) {
    const driver = await getDriver();
    try {
        await driver.get(`https://www.amazon.in/s?k=${encodeURIComponent(query)}`);
        
        // Wait for results
        await driver.wait(until.elementLocated(By.css('div[data-component-type="s-search-result"]')), 15000);
        
        // Human-like scrolling
        await driver.executeScript('window.scrollTo(0, 1000);');
        await driver.sleep(2000);

        const items = await driver.findElements(By.css('div[data-component-type="s-search-result"]'));
        const products = [];

        for (const item of items.slice(0, 15)) {
            try {
                const title = await item.findElement(By.css('h2 span')).getText();
                
                let price = "0";
                try {
                    price = await item.findElement(By.css('.a-price-whole')).getText();
                } catch (e) {}

                const image = await item.findElement(By.css('img.s-image')).getAttribute('src');
                const link = await item.findElement(By.css('h2 a')).getAttribute('href');
                
                let rating = "4.2";
                try {
                    const ratingText = await item.findElement(By.css('.a-icon-alt')).getAttribute('textContent');
                    rating = ratingText.split(' ')[0];
                } catch (e) {}

                if (title && price !== "0") {
                    products.push({
                        title: title.substring(0, 200),
                        price: parseInt(price.replace(/[^\d]/g, '')),
                        image_url: image,
                        url: link,
                        rating: rating,
                        source: 'Amazon',
                        category: category,
                        timestamp: new Date()
                    });
                }
            } catch (e) {}
        }
        console.log(`Amazon: ${products.length} items found`);
        return products;
    } catch (err) {
        console.error('Amazon Scrape Error:', err.message);
        return [];
    } finally {
        await driver.quit();
    }
}

// =========================================
// FLIPKART SCRAPER (AXIOS/CHEERIO - Working)
// =========================================
async function scrapeFlipkart(query, category) {
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
    try {
        const { data } = await axios.get(url, {
            headers: { 'User-Agent': getRandomAgent() },
            timeout: 8000
        });
        const $ = cheerio.load(data);
        const products = [];

        $('div[data-id]').each((i, el) => {
            if (i >= 15) return;
            const title = $(el).find('div.KzDlHZ, a.wjcEIp, a.IRpw9B, div._4rR01T, a._1fQ6S9').first().text().trim();
            const price = $(el).find('div.Nx9bqj, div._30jeq3').first().text().replace(/[^\d]/g, '').trim();
            const image = $(el).find('img').attr('src');
            const href = $(el).find('a').attr('href');

            if (title && price && href) {
                products.push({
                    title: title.substring(0, 200),
                    price: parseInt(price),
                    image_url: image,
                    url: `https://www.flipkart.com${href}`,
                    rating: $(el).find('div.XQD9uA, div._3LWZlK, span._1lRcqv').first().text().trim() || '4.3',
                    source: 'Flipkart',
                    category: category,
                    timestamp: new Date()
                });
            }
        });
        console.log(`Flipkart: ${products.length} items found`);
        return products;
    } catch (err) {
        console.error('Flipkart Scrape Error:', err.message);
        return [];
    }
}

// =========================================
// MYNTRA SCRAPER (SELENIUM)
// =========================================
async function scrapeMyntra(query, category) {
    const driver = await getDriver();
    try {
        await driver.get(`https://www.myntra.com/${encodeURIComponent(query.replace(/\s+/g, '-'))}`);
        
        // Wait for results
        await driver.wait(until.elementLocated(By.css('li.product-base')), 15000);
        
        // Scroll to trigger lazy loading
        await driver.executeScript('window.scrollTo(0, 1200);');
        await driver.sleep(2500);

        const items = await driver.findElements(By.css('li.product-base'));
        const products = [];

        for (const item of items.slice(0, 15)) {
            try {
                const brand = await item.findElement(By.css('.product-brand')).getText();
                const name = await item.findElement(By.css('.product-product')).getText();
                const title = `${brand} ${name}`;

                let price = "0";
                try {
                    price = await item.findElement(By.css('.product-discountedPrice, .product-price')).getText();
                    price = price.split('Rs.').pop().trim().replace(/[^\d]/g, '');
                } catch (e) {}

                const image = await item.findElement(By.css('img')).getAttribute('src');
                const link = await item.findElement(By.css('a')).getAttribute('href');

                if (title && price !== "0") {
                    products.push({
                        title: title.substring(0, 200),
                        price: parseInt(price),
                        image_url: image,
                        url: link,
                        rating: '4.4',
                        source: 'Myntra',
                        category: category,
                        timestamp: new Date()
                    });
                }
            } catch (e) {}
        }
        console.log(`Myntra: ${products.length} items found`);
        return products;
    } catch (err) {
        console.error('Myntra Scrape Error:', err.message);
        return [];
    } finally {
        await driver.quit();
    }
}

// =========================================
// MAIN EXPORT
// =========================================
async function searchAllProducts(query, category) {
    console.log(`--- SCRAPE START: ${query} ---`);
    const results = await Promise.all([
        scrapeAmazon(query, category),
        scrapeFlipkart(query, category),
        scrapeMyntra(query, category)
    ]);

    let allProducts = results.flat();
    allProducts = removeDuplicates(allProducts);
    
    console.log(`--- SCRAPE COMPLETE: ${allProducts.length} TOTAL PRODUCTS ---`);
    return allProducts;
}

module.exports = {
    scrapeAmazon,
    scrapeFlipkart,
    scrapeMyntra,
    searchAllProducts
};