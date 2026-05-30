# LEGACY PROXY MODULE
# This file exists to maintain compatibility with existing imports.
# The scraping architecture has been split into two dedicated systems:
# 1. search_scraper.py (Optimized for fast multi-product searches)
# 2. analyze_scraper.py (High-accuracy single product analysis)

from .search_scraper import get_real_time_products, get_real_time_products_stream
from .analyze_scraper import scrape_direct_link

# Aliases for compatibility
get_search_results = get_real_time_products
get_search_results_stream = get_real_time_products_stream

print("[DEBUG] Scraper Proxy Loaded: Redirecting to search_scraper/analyze_scraper")
