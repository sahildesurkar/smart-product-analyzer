const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const { scrapeAmazon, scrapeFlipkart, scrapeMyntra } = require('./scrapers');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = 'smart_analyzer';
let client;

async function connectDB() {
    if (!client) {
        client = new MongoClient(mongoUri);
        await client.connect();
        console.log('Connected to MongoDB');
    }
    return client.db(dbName);
}

async function updateProductData(product) {
    const db = await connectDB();
    const productsColl = db.collection('analyzer_product');
    const historyColl = db.collection('analyzer_pricehistory');

    // Update or Insert Product
    console.log(`Saving product: ${product.title} (${product.url})`);
    const result = await productsColl.findOneAndUpdate(
        { url: product.url },
        { 
            $set: { 
                title: product.title, 
                price: product.price, 
                image_url: product.image_url, 
                rating: product.rating,
                category: product.category,
                description: `Sourced from ${product.source}`,
                updated_at: new Date()
            },
            $setOnInsert: { created_at: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
    );

    const productId = result ? result._id : null;

    if (productId) {
        // Add to Price History
        await historyColl.insertOne({
            product_id: productId,
            price: product.price,
            website_name: product.source,
            date_recorded: new Date()
        });
    }
}

const queries = [
    { q: 'laptop', cat: 'Electronics' },
    { q: 'iphone', cat: 'Electronics' },
    { q: 'samsung', cat: 'Electronics' },
    { q: 'macbook', cat: 'Electronics' },
    { q: 'camera', cat: 'Electronics' },
    { q: 'shoes', cat: 'Shoes' },
    { q: 't-shirt', cat: 'Fashion' },
    { q: 'watch', cat: 'Fashion' },
    { q: 'flute', cat: 'Musical Instruments' },
    { q: 'chair', cat: 'Furniture' },
    { q: 'sofa', cat: 'Furniture' }
];

async function runScrapers() {
    console.log('Starting background scraping task...');
    for (const item of queries) {
        console.log(`Scraping for: ${item.q} (Category: ${item.cat})`);
        try {
            const [amazonResults, flipkartResults, myntraResults] = await Promise.all([
                scrapeAmazon(item.q, item.cat),
                scrapeFlipkart(item.q, item.cat),
                scrapeMyntra(item.q, item.cat)
            ]);

            const allResults = [...amazonResults, ...flipkartResults, ...myntraResults];
            console.log(`Found ${allResults.length} products for ${item.q}`);
            for (const p of allResults) {
                await updateProductData(p);
            }
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (err) {
            console.error(`Error scraping for ${item.q}:`, err.message);
        }
    }
    console.log('Scraping task completed.');
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
    runScrapers();
});

// Run once on start
runScrapers();
