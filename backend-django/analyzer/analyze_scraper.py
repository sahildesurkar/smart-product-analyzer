import requests
from bs4 import BeautifulSoup
import re
import random
import concurrent.futures
import time
import json
from urllib.parse import quote
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

try:
    import undetected_chromedriver as uc
    UC_AVAILABLE = True
except ImportError:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    UC_AVAILABLE = False

# Optimized headers for API/Requests
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
]

def get_driver():
    """Stable driver with high-performance flags and anti-detection"""
    ua = random.choice(USER_AGENTS)
    
    from selenium.webdriver.chrome.options import Options
    chrome_options = Options()
    # Use new headless mode which is more stable
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument(f"user-agent={ua}")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--lang=en-US,en;q=0.9")
    
    # Stealth settings
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    
    # PERFORMANCE: Disable images and notifications to speed up load time
    chrome_options.add_experimental_option("prefs", {
        "profile.managed_default_content_settings.images": 2,
        "profile.default_content_setting_values.notifications": 2,
        "intl.accept_languages": "en-US,en"
    })
    
    from selenium import webdriver
    try:
        # Standard driver with extra stealth scripts
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        driver.set_page_load_timeout(20) 
        return driver
    except Exception as e:
        print(f"Driver Init Error: {e}")
        return None

def scrape_flipkart(query):
    """Refined Flipkart Scraper with updated selectors"""
    print(f"BS4 [Flipkart]: Searching for {query}")
    results = []
    try:
        ua = random.choice(USER_AGENTS)
        url = f"https://www.flipkart.com/search?q={quote(query)}"
        headers = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Referer": "https://www.google.com/",
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Updated selectors for 2024/2025 structure
        items = soup.select("div[data-id], .cPHDOP, .slAVV4, ._1AtVbE, ._75W99U")
        
        for item in items[:25]:
            try:
                # Greedy title fallback
                title_elem = item.select_one(".WURP6, .KzDlHZ, .s1Q9rs, .IRpw9B, .wjcEIp, ._4rR01T, ._2WkVRV")
                title = ""
                if title_elem:
                    title = title_elem.text.strip()
                else:
                    # Look for img alt or a title
                    img = item.find("img", alt=True)
                    if img: title = img['alt']
                    else:
                        a = item.find("a", title=True)
                        if a: title = a['title']
                
                # Greedy price fallback
                price_elem = item.select_one(".Nx9bqj, ._30jeq3, ._25b18c, [class*='price']")
                if not price_elem:
                    price_elem = item.find(string=re.compile(r'₹'))
                
                price_text = price_elem.text.strip() if price_elem else ""
                price_text = re.sub(r"[^\d]", "", price_text.split('.')[0])
                price = int(price_text) if price_text else 0
                
                if not title: continue

                img_elem = item.find("img")
                img = ""
                if img_elem:
                    img = img_elem.get("src") or img_elem.get("data-src") or ""
                
                if img.startswith('//'): img = 'https:' + img

                link_elem = item if item.name == "a" else (item.find("a", href=True) or item.find_parent("a", href=True))
                if not link_elem: continue
                link = link_elem.get("href")
                if not link.startswith('http'): link = "https://www.flipkart.com" + link

                results.append({
                    "title": title[:200],
                    "price": price or 1000,
                    "image_url": img,
                    "rating": "4.2",
                    "source": "Flipkart",
                    "url": link,
                    "description": "Flipkart product"
                })
            except: continue
            
        print(f"Flipkart: {len(results)} items found")
    except Exception as e:
        print(f"Flipkart Error: {e}")
    return results

def scrape_myntra(query):
    """Hybrid Myntra Scraper: Try JSON first, fallback to Selenium HTML"""
    print(f"BS4 [Myntra]: Searching for {query}")
    results = []
    try:
        ua = random.choice(USER_AGENTS)
        # Use search URL instead of categorical URL
        url = f"https://www.myntra.com/search?q={quote(query)}"
        headers = {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Referer": "https://www.google.com/"
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Step 1: Try JSON extraction
        script_tags = soup.find_all("script")
        data_json = None
        for script in script_tags:
            if script.string and "window.__myx =" in script.string:
                try:
                    json_str = script.string.split("window.__myx =")[1].split(";")[0].strip()
                    data_json = json.loads(json_str)
                    break
                except: continue
        
        if data_json and 'searchData' in data_json:
            products = data_json['searchData']['results']['products']
            for p in products[:15]:
                try:
                    brand = p.get('brand', '')
                    name = p.get('productName', '')
                    title = f"{brand} {name}"
                    price = int(p.get('price', 0))
                    img = p.get('searchImage', '')
                    if img and not img.startswith('http'):
                        img = 'https://assets.myntassets.com/' + img
                    link = "https://www.myntra.com/" + p.get('landingPageUrl', '')
                    if title:
                        results.append({
                            "title": title[:200], "price": price or 1000, "image_url": img,
                            "rating": str(round(p.get('rating', 4.2), 1)), "source": "Myntra", "url": link,
                            "description": "Myntra product"
                        })
                except: continue
        
        # Step 2: Fallback to Selenium if JSON fails
        if not results:
            print("Myntra JSON failed. Trying Selenium fallback...")
            driver = None
            try:
                driver = get_driver()
                if driver:
                    driver.get(url)
                    time.sleep(2)
                    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.CSS_SELECTOR, ".product-base, [class*='product']")))
                    soup = BeautifulSoup(driver.page_source, "html.parser")
                    items = soup.select(".product-base, [class*='product-base']")
                    for item in items[:15]:
                        try:
                            brand_el = item.select_one(".product-brand, [class*='brand']")
                            name_el = item.select_one(".product-product, [class*='product']")
                            price_el = item.select_one(".product-discountedPrice, .product-price, [class*='price']")
                            img_el = item.find("img")
                            link_el = item.find("a", href=True)
                            
                            brand = brand_el.text.strip() if brand_el else ""
                            name = name_el.text.strip() if name_el else ""
                            price_text = price_el.text.strip() if price_el else "0"
                            price = int(re.sub(r"[^\d]", "", price_text.split('.')[0]))
                            img = img_el["src"] if img_el else ""
                            link = "https://www.myntra.com/" + link_el["href"] if link_el else ""
                            
                            if (brand or name) and link:
                                results.append({
                                    "title": f"{brand} {name}"[:200], "price": price or 1000, "image_url": img,
                                    "rating": "4.2", "source": "Myntra", "url": link,
                                    "description": "Myntra product"
                                })
                        except: continue
            except Exception as se:
                print(f"Myntra Selenium Error: {se}")
            finally:
                if driver: driver.quit()
            
        print(f"Myntra: {len(results)} items found")
    except Exception as e:
        print(f"Myntra Error: {e}")
    return results

def scrape_amazon(query):
    """Overhauled Amazon Scraper with explicit waits and CAPTCHA detection"""
    print(f"Selenium [Amazon]: Searching for {query}")
    driver = None
    results = []
    try:
        driver = get_driver()
        if not driver: return []
        
        # Strategy 1: Desktop Search
        url = f"https://www.amazon.in/s?k={quote(query)}&ref=nb_sb_noss"
        driver.get(url)
        time.sleep(random.uniform(2, 4))
        
        # Strategy 2: If CAPTCHA or No Results, try Mobile View
        if "captcha" in driver.page_source.lower() or "robot" in driver.page_source.lower() or "s-search-result" not in driver.page_source:
            print("Amazon blocked or no results. Trying mobile fallback...")
            driver.delete_all_cookies()
            mobile_url = f"https://www.amazon.in/gp/aw/s/ref=nb_sb_noss?k={quote(query)}"
            driver.get(mobile_url)
            time.sleep(3)

        soup = BeautifulSoup(driver.page_source, "html.parser")
        items = soup.select("div[data-component-type='s-search-result'], .s-result-item[data-asin], [class*='search-result']")
        
        for item in items[:20]:
            try:
                # 1. Title Extraction & Cleaning
                title_elem = item.select_one("h2 span, .a-size-medium, .a-size-base-plus, .a-text-normal, [class*='title']")
                title = title_elem.text.strip() if title_elem else ""
                title = title.replace("Sponsored", "").replace("sponsored", "").strip()

                # 2. Precise Price Extraction
                # Amazon often puts price twice (mobile/desktop). We take only the first occurrence.
                price_elem = item.select_one(".a-price-whole, .a-price .a-offscreen")
                if not price_elem:
                    price_elem = item.select_one("[class*='price']")
                
                price_text = price_elem.text.strip() if price_elem else ""
                # Take only the first sequence of digits found
                price_match = re.search(r"(\d{1,3}(,\d{3})*(\.\d+)?)", price_text)
                if price_match:
                    price_text = price_match.group(1).replace(",", "")
                    price = int(float(price_text))
                else:
                    price = 0
                
                if not title or price == 0: continue
                
                # 3. URL Normalization (Strip tracking params to avoid duplicates)
                link_elem = item.select_one("h2 a, a.a-link-normal, a[href*='/dp/']")
                if not link_elem: continue
                link = link_elem.get("href")
                if not link or "javascript" in link: continue
                if not link.startswith('http'): link = "https://www.amazon.in" + link
                
                # Normalize Amazon URL to base DP link
                asin_match = re.search(r"/(?:dp|gp/product)/([A-Z0-9]{10})", link)
                if asin_match:
                    link = f"https://www.amazon.in/dp/{asin_match.group(1)}"
                
                img_elem = item.select_one("img.s-image, img")
                img = img_elem.get("src") if img_elem else ""
                
                rating = "4.2"
                rating_elem = item.select_one("span.a-icon-alt, .a-star-small")
                if rating_elem:
                    rm = re.search(r"([0-5](\.\d)?)", rating_elem.text)
                    if rm: rating = rm.group(1)

                results.append({
                    "title": title[:200],
                    "price": price,
                    "image_url": img,
                    "rating": rating,
                    "source": "Amazon",
                    "url": link,
                    "description": "Amazon product"
                })
            except: continue
            
        print(f"Amazon: {len(results)} items found")
    except Exception as e:
        print(f"Amazon Error: {e}")
    finally:
        if driver: driver.quit()
    return results

def clean_price(price_str):
    if not price_str: return 0
    num = "".join(re.findall(r'\d+', str(price_str)))
    return int(num) if num else 0

def scrape_ajio(query):
    """Hybrid Ajio Scraper: BS4 with Selenium fallback"""
    print(f"BS4 [Ajio]: Searching for {query}")
    results = []
    url = f"https://www.ajio.com/search/?text={quote(query)}"
    try:
        headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/"
        }
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.select(".item")
        if not items:
            items = soup.select("div[class*='item'], .product-tile")
            
        for item in items[:10]:
            try:
                brand_el = item.select_one(".brand, .prod-brand")
                name_el = item.select_one(".name, .prod-name")
                price_el = item.select_one(".price, .prod-sp")
                img_el = item.select_one(".imgC, img")
                link_el = item.select_one("a")
                
                if not (brand_el and price_el): continue
                
                brand = brand_el.text.strip()
                name = name_el.text.strip() if name_el else ""
                price_text = price_el.text.strip()
                img = img_el.get("src") if img_el else ""
                link = "https://www.ajio.com" + link_el.get("href")
                price = int(re.sub(r"[^\d]", "", price_text.split('.')[0]))
                
                if brand and price:
                    results.append({
                        "title": f"{brand} {name}"[:200], "price": price, "image_url": img,
                        "rating": "4.1", "source": "Ajio", "url": link
                    })
            except: continue
            
        # Fallback to Selenium if BS4 blocked
        if not results:
            print("Ajio BS4 blocked or no results. Trying Selenium fallback...")
            driver = None
            try:
                driver = get_driver()
                if driver:
                    driver.get(url)
                    # Wait for items
                    WebDriverWait(driver, 15).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".item, div[class*='item'], .rilrtl-products-list__item"))
                    )
                    soup = BeautifulSoup(driver.page_source, "html.parser")
                    items = soup.select(".item, div[class*='item'], .rilrtl-products-list__item")
                    for item in items[:15]:
                        try:
                            brand_el = item.select_one(".brand, .prod-brand, [class*='brand']")
                            name_el = item.select_one(".name, .prod-name, [class*='name']")
                            price_el = item.select_one(".price, .prod-sp, [class*='price']")
                            img_el = item.select_one("img")
                            link_el = item.select_one("a")
                            
                            brand = brand_el.text.strip() if brand_el else ""
                            name = name_el.text.strip() if name_el else ""
                            price_text = price_el.text.strip() if price_el else "0"
                            img = img_el.get("src") or img_el.get("data-src") if img_el else ""
                            link = "https://www.ajio.com" + link_el.get("href") if link_el else ""
                            
                            price = int(re.sub(r"[^\d]", "", price_text.split('.')[0]))
                            if (brand or name) and link:
                                results.append({
                                    "title": f"{brand} {name}"[:200], "price": price or 1000, "image_url": img,
                                    "rating": "4.1", "source": "Ajio", "url": link,
                                    "description": "Ajio product"
                                })
                        except: continue
            except Exception as se:
                print(f"Ajio Selenium Error: {se}")
            finally:
                if driver: driver.quit()
                
        print(f"Ajio: {len(results)} items found")
    except Exception as e:
        print(f"Ajio Error: {e}")
    return results

def scrape_meesho(query):
    """Refined Meesho Scraper with multi-stage scrolling"""
    print(f"Selenium [Meesho]: Searching for {query}")
    driver = None
    results = []
    try:
        driver = get_driver()
        url = f"https://www.meesho.com/search?q={quote(query)}"
        driver.get(url)
        
        # Single scroll is often enough to trigger React hydration
        driver.execute_script("window.scrollTo(0, 500);")
        time.sleep(1.5)
        
        soup = BeautifulSoup(driver.page_source, "html.parser")
        # Meesho cards have class names containing 'ProductCard' or are inside specific links
        items = soup.select("div[class*='ProductCard'], a[href*='/p/']")
        
        if not items:
            # Fallback for updated Meesho layout
            items = soup.find_all("div", recursive=True)
            items = [i for i in items if i.get('class') and any('ProductCard' in c for c in i.get('class'))]

        for item in items[:12]:
            try:
                title_elem = item.select_one("p[class*='ProductTitle'], span[class*='ProductTitle']")
                if not title_elem: title_elem = item.find("p")
                title = title_elem.text.strip() if title_elem else ""
                
                price_elem = item.select_one("h5[class*='Price'], h4[class*='Price']")
                if not price_elem: price_elem = item.find("h5")
                price_text = price_elem.text.strip() if price_elem else ""
                price_text = re.sub(r"[^\d]", "", price_text.split('.')[0])
                price = int(price_text) if price_text else 0
                
                img_el = item.find("img")
                img = img_el.get("src") if img_el else ""
                
                link_elem = item if item.name == "a" else item.find("a", href=True)
                if not link_elem: continue
                link = "https://www.meesho.com" + link_elem.get("href")
                
                if title and price:
                    results.append({
                        "title": title[:200], "price": price, "image_url": img,
                        "rating": "4.2", "source": "Meesho", "url": link
                    })
            except: continue
            
        if not results:
            print(f"Meesho DEBUG: 0 results. Title: {soup.title.text if soup.title else 'No Title'}")
            
        print(f"Meesho: {len(results)} items found")
    except Exception as e:
        print(f"Meesho Error: {e}")
    return results

def get_real_time_products_stream(query, filter_relevance=True):
    """
    GENERATOR version of the scraper collector.
    Yields results site-by-site as they arrive.
    """
    print(f"--- STREAMING SCRAPE START: {query} (Filter: {filter_relevance}) ---")
    seen_urls = set()
    
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=5)
    futures = {
        executor.submit(scrape_amazon, query): "Amazon",
        executor.submit(scrape_flipkart, query): "Flipkart",
        executor.submit(scrape_myntra, query): "Myntra",
        executor.submit(scrape_ajio, query): "Ajio",
        executor.submit(scrape_meesho, query): "Meesho"
    }
    
    try:
        # As completed allows us to yield as soon as ONE site finishes
        for future in concurrent.futures.as_completed(futures, timeout=25):
            site = futures[future]
            try:
                data = future.result()
                if data:
                    site_results = []
                    for item in data:
                        url = item.get('url', '').split('?')[0].lower().strip()
                        if url in seen_urls: continue
                        seen_urls.add(url)
                        
                        if item.get('title') and item.get('price'):
                            # RELEVANCE FILTER (Optional)
                            if filter_relevance:
                                title_lower = item['title'].lower()
                                # Only filter if the query has meaningful words
                                query_words = [w.lower() for w in query.split() if len(w) > 3]
                                if query_words:
                                    # Relaxed: Match at least ONE keyword
                                    if not any(w in title_lower for w in query_words):
                                        continue
                            
                            item['id'] = f"{item['source'].lower()}-{random.randint(100000, 999999)}"
                            site_results.append(item)
                    
                    if site_results:
                        print(f"Streaming {len(site_results)} items from {site}")
                        yield site_results
            except Exception as e:
                print(f"Stream error from {site}: {e}")
    except Exception as e:
        print(f"Global Stream Error: {e}")
    finally:
        executor.shutdown(wait=False)

def get_real_time_products(query, filter_relevance=True):
    """Legacy wrapper that collects all results from the stream into a single list"""
    all_results = []
    for chunk in get_real_time_products_stream(query, filter_relevance=filter_relevance):
        all_results.extend(chunk)
    return all_results

def scrape_direct_link(url):
    """Advanced direct link analyzer for all major platforms with robust scraping"""
    print(f"[SCRAPING PRODUCT] Initiating direct scrape for: {url}")
    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        response = requests.get(url, headers=headers, timeout=15)
        
        # Check if we got blocked or CAPTCHA'd
        if response.status_code != 200 or "captcha" in response.text.lower() or "robot" in response.text.lower():
            print(f"[WARNING] Requests blocked or failed (Status: {response.status_code}). Using Selenium fallback...")
            driver = get_driver()
            if driver:
                driver.get(url)
                time.sleep(3) # Wait for page to load
                html = driver.page_source
                driver.quit()
                soup = BeautifulSoup(html, 'html.parser')
            else:
                soup = BeautifulSoup(response.text, 'html.parser')
        else:
            soup = BeautifulSoup(response.text, 'html.parser')
            
        title = ""
        price = 0
        image = ""
        source = "Store"

        # General Fallbacks
        og_title = soup.find("meta", property="og:title") or soup.find("meta", name="title")
        if og_title: title = og_title.get("content", "")
        
        og_image = soup.find("meta", property="og:image")
        if og_image: image = og_image.get("content", "")

        if "amazon" in url:
            source = "Amazon"
            title_elem = soup.select_one("#productTitle, #title, .a-size-large, h1 span")
            if title_elem: title = title_elem.text.strip()
            # Multi-layer price search for Amazon
            p_elem = soup.select_one(".a-price .a-offscreen, .a-price-whole, #priceblock_ourprice, #priceblock_dealprice, span[class*='price']")
            if p_elem: price = int(re.sub(r"[^\d]", "", p_elem.text.split('.')[0]))
        elif "flipkart" in url:
            source = "Flipkart"
            title_elem = soup.select_one(".B_NuCI, .WURP6, .KzDlHZ, ._40vAnL, span.VU-ZEz, h1.yhB1nd")
            if title_elem: title = title_elem.text.strip()
            # Multi-layer price search for Flipkart
            p_elem = soup.select_one(".Nx9bqj, ._30jeq3, ._25b18c, div.Nx9bqj.CxhGGd, [class*='price']")
            if p_elem: price = int(re.sub(r"[^\d]", "", p_elem.text.split('.')[0]))
        elif "myntra" in url:
            source = "Myntra"
            brand_elem = soup.select_one(".pdp-title, .product-brand")
            name_elem = soup.select_one(".pdp-name, .product-product")
            if brand_elem and name_elem: title = f"{brand_elem.text.strip()} {name_elem.text.strip()}"
            p_elem = soup.select_one(".pdp-price strong, .product-discountedPrice, .product-price")
            if p_elem: price = int(re.sub(r"[^\d]", "", p_elem.text.split('.')[0]))
        elif "ajio" in url:
            source = "Ajio"
            brand_elem = soup.select_one(".prod-brand, .brand")
            name_elem = soup.select_one(".prod-name, .name")
            if brand_elem and name_elem: title = f"{brand_elem.text.strip()} {name_elem.text.strip()}"
            p_elem = soup.select_one(".prod-sp, .price")
            if p_elem: price = int(re.sub(r"[^\d]", "", p_elem.text.split('.')[0]))
        elif "meesho" in url:
            source = "Meesho"
            title_elem = soup.select_one("h3, p[class*='ProductTitle']")
            if title_elem: title = title_elem.text.strip()
            p_elem = soup.select_one("h4, h5[class*='Price']")
            if p_elem: price = int(re.sub(r"[^\d]", "", p_elem.text.split('.')[0]))

        # Final price recovery if still 0
        if price == 0:
            price_match = re.search(r"(?:₹|Rs\.?)\s*(\d{1,3}(?:,\d{3})*(?:\.\d+)?)", soup.get_text())
            if price_match:
                price_str = price_match.group(1).replace(",", "")
                price = int(float(price_str))
            
        if not title: title = soup.title.text.strip() if soup.title else ""
            
        if not title:
            # Absolute last fallback for title - try to extract from URL
            try:
                parts = url.split('/')
                for p in parts:
                    if '-' in p and len(p) > 10:
                        title = p.replace('-', ' ').title()
                        break
            except: pass

        if not title:
            print("[ERROR] Could not extract title from direct link.")
            return None
            
        if not url:
            print("[ERROR] Final product URL is missing.")
            return None
            
        print(f"[SCRAPING SUCCESS] Found: {title[:50]}... @ {price}")
        print("PRODUCT URL:", url)
        return {
            "title": title[:200],
            "price": price,
            "image_url": image,
            "rating": "4.2",
            "source": source,
            "url": url
        }
    except Exception as e: 
        print(f"[ERROR] scrape_direct_link failed: {e}")
        return None
