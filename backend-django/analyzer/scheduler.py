from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import logging
from analyzer.models import SearchHistory
from analyzer.scraper import get_real_time_products
from analyzer.views import save_product_and_history

logger = logging.getLogger(__name__)

def update_product_prices():
    """Background task to fetch latest prices for top products"""
    logger.info("Starting background price update...")
    try:
        # Get unique top queries from SearchHistory to re-scrape
        recent_searches = SearchHistory.objects.order_by('-timestamp').limit(10)
        queries = set([s.query for s in recent_searches if s.query])
        
        # If no history, do some default queries
        if not queries:
            queries = ["iPhone 17", "Samsung S24", "MacBook Pro M3"]
            
        for query in queries:
            logger.info(f"Background scraping for: {query}")
            results = get_real_time_products(query, filter_relevance=False)
            for p_data in results:
                save_product_and_history(p_data, "Background")
        logger.info("Background price update complete.")
    except Exception as e:
        logger.error(f"Background update failed: {e}")

def start_scheduler():
    scheduler = BackgroundScheduler()
    # Run every 4 hours
    scheduler.add_job(
        update_product_prices,
        trigger=IntervalTrigger(hours=4),
        id='update_prices_job',
        name='Update product prices every 4 hours',
        replace_existing=True,
    )
    try:
        scheduler.start()
        logger.info("Price tracking scheduler started successfully.")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
