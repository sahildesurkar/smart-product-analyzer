
import requests
from bs4 import BeautifulSoup
import re
import random
import time
import json
import concurrent.futures
from urllib.parse import quote

# --- CONFIG ---
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
]

session = requests.Session()

def get_headers(referer="https://www.google.com/"):
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-IN,en-US;q=0.9,en;q=0.8",
        "Referer": referer,
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

def _clean_price(text: str) -> int:
    if not text: return 0
    try:
        # Remove anything that isn't a digit
        clean = re.sub(r"[^\d]", "", str(text))
        return int(clean) if clean else 0
    except:
        return 0

def _get_selenium_driver():
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    opts = Options()
    opts.add_argument("--headless=new")
    opts.add_argument("--disable-gpu")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument(f"user-agent={random.choice(USER_AGENTS)}")
    try:
        driver = webdriver.Chrome(options=opts)
        driver.set_page_load_timeout(30)
        return driver
    except Exception as e:
        print(f"[ERROR] Selenium init failed: {e}")
        return None

# --- SCRAPERS ---

def _scrape_amazon(query: str) -> list:
    print(f"[AMAZON] Searching: {query}")
    url = f"https://www.amazon.in/s?k={quote(query)}"
    results = []
    
    try:
        res = session.get(url, headers=get_headers(), timeout=15)
        if "captcha" in res.text.lower():
            # Fallback to Selenium
            driver = _get_selenium_driver()
            if driver:
                driver.get(url)
                time.sleep(3)
                soup = BeautifulSoup(driver.page_source, "html.parser")
                driver.quit()
            else: return []
        else:
            soup = BeautifulSoup(res.text, "html.parser")
            
        items = soup.select("div[data-asin]:not([data-asin=''])")
        for item in items[:20]:
            title_el = item.select_one("h2 span, .a-size-medium, .a-size-base-plus, [data-cy='title-recipe'] h2 span")
            price_el = item.select_one(".a-price-whole")
            img_el = item.select_one("img.s-image")
            
            title = title_el.text.strip() if title_el else ""
            price = _clean_price(price_el.text) if price_el else 0
            img = img_el.get("src") if img_el else ""
            link = item.get("data-asin")
            if link:
                link = f"https://www.amazon.in/dp/{link}"
            else:
                link_el = item.select_one("h2 a, .a-link-normal")
                link = link_el['href'] if link_el else ""
                if link and not link.startswith('http'):
                    link = "https://www.amazon.in" + ("" if link.startswith('/') else "/") + link
            
            if title and price > 0 and link:
                print("PRODUCT URL:", link)
                results.append({"title": title, "price": price, "image_url": img, "source": "Amazon", "url": link, "rating": "4.1"})
    except Exception as e:
        print(f"[AMAZON] Error: {e}")
    return results

def _scrape_flipkart(query: str) -> list:
    print(f"[FLIPKART] Searching: {query}")
    url = f"https://www.flipkart.com/search?q={quote(query)}"
    results = []
    
    for attempt in range(2):
        try:
            time.sleep(random.uniform(1, 2))
            res = session.get(url, headers=get_headers(), timeout=12)
            
            if res.status_code == 403 or "captcha" in res.text.lower():
                print(f"[FLIPKART] 403 or Captcha on attempt {attempt+1}. Trying Selenium...")
                driver = _get_selenium_driver()
                if driver:
                    driver.get(url)
                    time.sleep(4)
                    soup = BeautifulSoup(driver.page_source, "html.parser")
                    driver.quit()
                else: break
            else:
                soup = BeautifulSoup(res.text, "html.parser")
                
            # Multiple layout support
            items = soup.select("div[data-id], ._1AtVbE, .cPHDOP")
            for item in items[:25]:
                title_el = item.select_one(".KzDlHZ, .WURP6, .IRpw9B")
                price_el = item.select_one("div.Nx9bqj, ._30jeq3")
                link_el = item.find("a", href=True)
                img_el = item.find("img")
                
                title = title_el.text.strip() if title_el else ""
                price = _clean_price(price_el.text) if price_el else 0
                link = link_el['href'] if link_el else ""
                if link and not link.startswith('http'):
                    link = "https://www.flipkart.com" + ("" if link.startswith('/') else "/") + link
                img = img_el.get("src") if img_el else ""
                
                if title and price > 0 and link:
                    print("PRODUCT URL:", link)
                    results.append({"title": title, "price": price, "image_url": img, "source": "Flipkart", "url": link, "rating": "4.2"})
            
            if results: break
        except Exception as e:
            print(f"[FLIPKART] Error on attempt {attempt}: {e}")
            
    return results

def _scrape_myntra(query: str) -> list:
    print(f"[MYNTRA] Searching: {query}")
    results = []
    driver = _get_selenium_driver()
    if not driver: return []
    
    try:
        driver.get(f"https://www.myntra.com/search?q={quote(query)}")
        time.sleep(4)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        
        items = soup.select("li.product-base")
        for item in items[:20]:
            brand_el = item.select_one(".product-brand")
            name_el = item.select_one(".product-product")
            price_el = item.select_one(".product-price, .product-discountedPrice")
            link_el = item.find("a", href=True)
            img_el = item.find("img")
            
            title = f"{brand_el.text if brand_el else ''} {name_el.text if name_el else ''}".strip()
            price = _clean_price(price_el.text) if price_el else 0
            link = link_el['href'] if link_el else ""
            if link and not link.startswith('http'):
                link = "https://www.myntra.com" + ("" if link.startswith('/') else "/") + link
            img = img_el.get("src") if img_el else ""
            
            if title and price > 0 and link:
                print("PRODUCT URL:", link)
                results.append({"title": title, "price": price, "image_url": img, "source": "Myntra", "url": link, "rating": "4.3"})
    except Exception as e:
        print(f"[MYNTRA] Error: {e}")
    finally:
        driver.quit()
    return results

def _scrape_meesho(query: str) -> list:
    print(f"[MEESHO] Searching: {query}")
    results = []
    driver = _get_selenium_driver()
    if not driver: return []
    
    try:
        driver.get(f"https://www.meesho.com/search?q={quote(query)}")
        time.sleep(5)
        # Scroll a bit
        driver.execute_script("window.scrollTo(0, 1000);")
        time.sleep(2)
        
        soup = BeautifulSoup(driver.page_source, "html.parser")
        items = soup.select("div[class*='ProductList__GridCard'], div[class*='NewProductCard']")
        for item in items[:20]:
            title_el = item.select_one("p[class*='ProductTitle']")
            price_el = item.select_one("h5[class*='PriceRow'], h5")
            link_el = item if item.name == "a" else (item.find("a", href=True) or item.find_parent("a", href=True))
            img_el = item.find("img")
            
            title = title_el.text.strip() if title_el else ""
            price = _clean_price(price_el.text) if price_el else 0
            
            link = ""
            if link_el:
                href = link_el.get('href', '')
                if '/p/' in href or '/s/' in href:
                    link = "https://www.meesho.com" + ("" if href.startswith('/') else "/") + href if not href.startswith('http') else href
            
            img = img_el.get("src") if img_el else ""
            
            if title and price > 0 and link:
                print("PRODUCT URL:", link)
                results.append({"title": title, "price": price, "image_url": img, "source": "Meesho", "url": link, "rating": "4.0"})
    except Exception as e:
        print(f"[MEESHO] Error: {e}")
    finally:
        driver.quit()
    return results

# --- ENGINE ---

def scrape_all_platforms_for_comparison(query: str) -> list:
    all_results = []
    tasks = {
        "Amazon": lambda: _scrape_amazon(query),
        "Flipkart": lambda: _scrape_flipkart(query),
        "Myntra": lambda: _scrape_myntra(query),
        "Meesho": lambda: _scrape_meesho(query)
    }
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(fn): name for name, fn in tasks.items()}
        for future in concurrent.futures.as_completed(futures, timeout=100):
            platform = futures[future]
            try:
                res = future.result()
                print(f"[ENGINE] {platform} yielded {len(res)} items")
                all_results.extend(res)
            except Exception as e:
                print(f"[ENGINE] {platform} failed: {e}")
                
    return all_results
