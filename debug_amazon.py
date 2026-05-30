import requests
from bs4 import BeautifulSoup
import random

def get_headers():
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    ]
    return {
        "User-Agent": random.choice(user_agents),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    }

def debug_amazon(url):
    print(f"Testing Amazon URL: {url}")
    try:
        response = requests.get(url, headers=get_headers(), timeout=15)
        print(f"Status Code: {response.status_code}")
        
        with open('debug_amazon.html', 'wb') as f:
            f.write(response.content)
            
        soup = BeautifulSoup(response.content, 'html.parser')
        title = soup.find('title')
        print(f"Page Title: {title.get_text() if title else 'N/A'}")
        
        # Check for CAPTCHA
        if "captcha" in response.text.lower() or "robot" in response.text.lower():
            print("DETECTED: Amazon CAPTCHA/Bot detection triggered.")
            
        # Check for title
        name = soup.find(id='productTitle')
        print(f"ID productTitle: {name.get_text(strip=True) if name else 'NOT FOUND'}")
        
        # Check for meta tags
        og_title = soup.find("meta", property="og:title")
        print(f"OG Title: {og_title.get('content') if og_title else 'NOT FOUND'}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_amazon("https://www.amazon.in/dp/B0DJBX69Z8")
