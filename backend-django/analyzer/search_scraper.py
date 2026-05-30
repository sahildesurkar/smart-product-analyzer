import requests
from bs4 import BeautifulSoup
import re
import random
import time
import json
from urllib.parse import quote

# --- PRODUCTION CONFIG ---

session = requests.Session()
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
]

def get_headers(mode="desktop"):
    if mode == "mobile":
        ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
    else:
        ua = random.choice(USER_AGENTS)
    
    return {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0"
    }

def clean_price(price_str):
    if not price_str: return 0
    try:
        clean = re.sub(r"[^\d]", "", str(price_str).split('.')[0])
        return int(clean) if clean else 0
    except:
        return 0

def get_driver(mobile=False):
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    if mobile:
        options.add_argument("--window-size=375,812")
        options.add_argument("user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1")
    else:
        options.add_argument("--window-size=1920,1080")
        options.add_argument(f"user-agent={random.choice(USER_AGENTS)}")
    
    try:
        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(20)
        return driver
    except Exception as e:
        print(f"[ERROR] Selenium Driver Init Failed: {e}")
        return None

# --- PLATFORM SCRAPERS ---

def scrape_flipkart_search(query):
    """EXACTLY AS IT WAS - DO NOT MODIFY"""
    print(f"\n--- [FLIPKART] Starting Scrape for: {query} ---")
    results = []
    url = f"https://www.flipkart.com/search?q={quote(query)}"
    try:
        res = session.get(url, headers=get_headers(), timeout=10)
        if res.status_code != 200: return []
        soup = BeautifulSoup(res.text, "html.parser")
        items = soup.select("div[data-id], ._1AtVbE, .cPHDOP, .slAVV4, ._75W99U")
        print(f"[INFO] Raw items found: {len(items)}")
        for item in items[:40]:
            try:
                title = ""
                title_el = item.select_one(".KzDlHZ, .WURP6, .IRpw9B, .s1Q9rs, ._4rR01T, ._2WkVRV, [title]")
                if title_el: title = title_el.get_text(strip=True) or title_el.get('title', '')
                if not title:
                    img_el = item.find("img", alt=True); title = img_el['alt'] if img_el else item.get_text(" ", strip=True)[:100]
                price_val = 0; price_el = item.select_one(".Nx9bqj, ._30jeq3, ._25b18c, [class*='price']")
                if price_el: price_val = clean_price(price_el.text)
                if not price_val:
                    price_match = re.search(r"₹\s?([\d,]+)", item.get_text())
                    if price_match: price_val = clean_price(price_match.group(1))
                price = price_val
                link_el = item if item.name == 'a' else (item.find("a", href=True) or item.find_parent("a", href=True))
                if not link_el: continue
                link = link_el.get("href")
                if not link.startswith('http'): link = "https://www.flipkart.com" + link
                img_el = item.find("img"); img = ""
                if img_el: img = img_el.get("src") or img_el.get("data-src") or img_el.get("srcset", "").split(' ')[0]
                if img.startswith('//'): img = 'https:' + img
                if title and price and link:
                    print("PRODUCT URL:", link)
                    results.append({"title": title[:200], "price": price, "image_url": img, "rating": "4.2", "source": "Flipkart", "url": link})
            except: continue
    except Exception as e: print(f"[ERROR] Flipkart failed: {e}")
    return results

def scrape_amazon_search(query):
    """REWRITTEN: Mobile Page Scraping with Retry Logic"""
    print(f"\n--- [AMAZON] Starting Scrape (Mobile Mode): {query} ---")
    results = []
    # Using mobile search URL often bypasses desktop bot detection
    url = f"https://www.amazon.in/s?k={quote(query)}&ref=is_s"
    
    for attempt in range(2):
        try:
            headers = get_headers(mode="mobile")
            res = session.get(url, headers=headers, timeout=12)
            
            if "captcha" in res.text.lower() or "api-services-support@amazon.com" in res.text:
                print(f"[RETRY] Amazon Captcha detected on attempt {attempt+1}. Retrying...")
                time.sleep(1)
                continue
                
            soup = BeautifulSoup(res.text, "html.parser")
            # Mobile selectors
            items = soup.select("div[data-asin], .s-result-item[data-component-type='s-search-result']")
            print(f"[INFO] Raw items found: {len(items)}")
            
            for item in items[:25]:
                try:
                    asin = item.get('data-asin')
                    if not asin: continue
                    
                    # Title - Greedy search for full title
                    title_el = item.select_one("h2, .a-size-small, .s-line-clamp-2, .a-size-medium, [data-cy='title-recipe'] h2, h2 span")
                    title = title_el.get_text(strip=True) if title_el else ""
                    
                    # Price
                    price_val = 0
                    price_el = item.select_one(".a-price-whole")
                    if price_el:
                        price_val = clean_price(price_el.text)
                    if not price_val:
                        price_match = re.search(r"₹\s?([\d,]+)", item.get_text())
                        if price_match: price_val = clean_price(price_match.group(1))
                    
                    # Link
                    link = f"https://www.amazon.in/dp/{asin}"
                    
                    # Image
                    img_el = item.find("img", class_="s-image")
                    img = img_el.get("src") if img_el else ""

                    if title and price_val > 0 and link:
                        print("PRODUCT URL:", link)
                        results.append({
                            "title": title[:200], "price": price_val, "image_url": img,
                            "rating": "4.2", "source": "Amazon", "url": link
                        })
                    else:
                        print(f"[VALIDATION FAILED] Amazon item missing Title/Price. Title: {bool(title)}, Price: {price_val}")
                except: continue
            
            if results: break # Success
        except Exception as e:
            print(f"[ERROR] Amazon attempt {attempt} failed: {e}")
    
    return results

def scrape_myntra_search(query):
    """REWRITTEN: Selenium-based Myntra Scraper with robust JSON extraction"""
    print(f"\n--- [MYNTRA] Starting Selenium Scrape: {query} ---")
    results = []
    driver = get_driver()
    if not driver: return []
    
    try:
        url = f"https://www.myntra.com/search?q={quote(query)}"
        driver.get(url)
        time.sleep(4) # Wait for initial React hydration
        
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Method 1: JSON Data Extraction (Most Reliable)
        script = soup.find('script', string=re.compile(r'window\.__myx\s*='))
        if script:
            try:
                json_str = re.search(r'window\.__myx\s*=\s*({.*?});', script.string)
                if json_str:
                    data = json.loads(json_str.group(1))
                    products = data.get('searchData', {}).get('results', {}).get('products', [])
                    print(f"[INFO] Myntra JSON products found: {len(products)}")
                    
                    for p in products[:30]:
                        title = f"{p.get('brand', '')} {p.get('product', '')}".strip()
                        price_val = p.get('price') or p.get('mrp')
                        link = "https://www.myntra.com/" + p.get('landingPageUrl', '')
                        img = p.get('searchImage') or p.get('defaultImage')
                        
                        if title and price_val and link:
                            print("PRODUCT URL:", link)
                            results.append({
                                "title": title[:200], "price": int(price_val), "image_url": img,
                                "rating": str(p.get('rating', '4.3')), "source": "Myntra", "url": link
                            })
                    if results:
                        return results
            except Exception as e:
                print(f"[WARNING] Myntra JSON parsing failed: {e}")
                
        # Method 2: DOM Fallback
        driver.execute_script("window.scrollTo(0, 1000);")
        time.sleep(2)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        items = soup.select(".product-base, li.product-base")
        print(f"[INFO] Myntra DOM items found: {len(items)}")
        
        for item in items[:30]:
            try:
                brand = item.select_one(".product-brand, h3.product-brand")
                name = item.select_one(".product-product, h4.product-product")
                title = f"{brand.text.strip() if brand else ''} {name.text.strip() if name else ''}".strip()
                
                price_val = 0
                price_el = item.select_one(".product-discountedPrice, .product-price, span.product-discountedPrice")
                if price_el:
                    price_val = clean_price(price_el.text)
                if not price_val:
                    price_match = re.search(r"Rs\.\s?([\d,]+)", item.get_text())
                    if price_match: price_val = clean_price(price_match.group(1))
                
                link_el = item.find("a", href=True)
                link = "https://www.myntra.com/" + link_el['href'].lstrip('/') if link_el else ""
                
                img_el = item.find("img")
                img = img_el.get("src") or img_el.get("data-src") or img_el.get("srcset", "").split(" ")[0] if img_el else ""
                
                if title and price_val > 0 and link:
                    print("PRODUCT URL:", link)
                    results.append({
                        "title": title[:200], "price": price_val, "image_url": img,
                        "rating": "4.3", "source": "Myntra", "url": link
                    })
            except: continue
    except Exception as e:
        print(f"[ERROR] Myntra failed: {e}")
    finally:
        driver.quit()
    return results

def scrape_meesho_search(query):
    """FIXED: Meesho Scraper with robust extraction"""
    print(f"\n--- [MEESHO] Starting Scrape: {query} ---")
    results = []
    driver = get_driver()
    if not driver: return []
    
    try:
        driver.get(f"https://www.meesho.com/search?q={quote(query)}")
        time.sleep(5) # Meesho needs time for its dynamic grid
        
        # Scroll to load images
        driver.execute_script("window.scrollTo(0, 1500);")
        time.sleep(2)
        
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        # Improved selector for product tiles
        items = soup.select("div[class*='ProductList__GridCard'], div[class*='ProductCard'], a[href*='/p/']")
        print(f"[INFO] Raw items found: {len(items)}")
        
        for item in items[:40]:
            try:
                # Greedy Title search
                title_el = item.select_one("p[class*='NewProductCard__ProductTitle'], span[class*='ProductTitle'], p")
                title = title_el.get_text(strip=True) if title_el else ""
                
                # Greedy Price search
                price_val = 0
                price_el = item.select_one("h5[class*='NewProductCard__PriceRow'], h5")
                if price_el:
                    price_val = clean_price(price_el.text)
                if not price_val:
                    price_match = re.search(r"₹\s?([\d,]+)", item.get_text())
                    if price_match: price_val = clean_price(price_match.group(1))
                
                # Greedy Link search
                link_el = item if (item.name == 'a' and '/p/' in item.get('href', '')) else (item.find("a", href=True) or item.find_parent("a", href=True))
                link = ""
                if link_el:
                    href = link_el.get('href', '')
                    if '/p/' in href or '/s/' in href:
                        link = "https://www.meesho.com" + ("" if href.startswith('/') else "/") + href if not href.startswith('http') else href
                
                img_el = item.find("img")
                img = img_el.get("src") if img_el else ""
                
                if title and price_val > 0 and link:
                    print("PRODUCT URL:", link)
                    results.append({
                        "title": title[:200], "price": price_val, "image_url": img,
                        "rating": "4.0", "source": "Meesho", "url": link
                    })
            except: continue
    except Exception as e:
        print(f"[ERROR] Meesho failed: {e}")
    finally:
        driver.quit()
    return results


# --- ENGINE ---

def get_real_time_products_stream(query, filter_relevance=True):
    """
    STABLE SEQUENTIAL ENGINE - FIXED STREAMING
    """
    print(f"\n[ENGINE] Sequential Scrape Start: {query}")
    start_total = time.time()
    
    platforms = [
        ("Amazon", scrape_amazon_search),
        ("Flipkart", scrape_flipkart_search),
        ("Myntra", scrape_myntra_search),
        ("Meesho", scrape_meesho_search)
    ]
    
    seen_urls = set()
    
    for name, scraper_func in platforms:
        try:
            start_site = time.time()
            data = scraper_func(query)
            print(f"[DEBUG] {name} scraper returned {len(data)} items to engine.")
            
            valid_results = []
            for item in data:
                # 1. RAW ITEM LOG
                # print(f"[RAW ITEM] {item['title'][:30]} from {name}")
                
                # 2. DEDUPE
                url_clean = item['url'].split('?')[0].lower().strip()
                if url_clean in seen_urls:
                    print(f"[DEDUPE REJECTED] {item['title'][:30]}")
                    continue
                seen_urls.add(url_clean)
                
                # 3. RELEVANCE
                if filter_relevance:
                    q_words = [w.lower() for w in query.split() if len(w) > 2]
                    # Synonyms
                    if 'saree' in q_words: q_words.append('sarees')
                    if 'phone' in q_words: q_words.append('mobile')
                    
                    t_low = item['title'].lower()
                    if q_words and not any(w in t_low for w in q_words):
                        print(f"[FILTER REJECTED] {item['title'][:30]} (Relevance)")
                        continue
                
                item['id'] = f"{name.lower()}-{random.randint(1000, 9999)}"
                valid_results.append(item)
            
            packet = {
                "type": "results",
                "platform": name,
                "data": valid_results,
                "count": len(valid_results),
                "time": round(time.time() - start_site, 2)
            }
            print(f"[STREAM SENT] {name} | {len(valid_results)} items actually yielded.")
            yield packet
            
        except Exception as e:
            print(f"[ERROR] {name} engine failure: {e}")
            yield {"type": "status", "platform": name, "status": "failed"}

    print(f"\n[ENGINE] Complete. Total Time: {round(time.time() - start_total, 2)}s")

def get_real_time_products(query, filter_relevance=True):
    all_data = []
    for packet in get_real_time_products_stream(query, filter_relevance):
        if packet.get('type') == 'results':
            all_data.extend(packet['data'])
    return all_data
