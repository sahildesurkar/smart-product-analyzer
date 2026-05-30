import requests
from bs4 import BeautifulSoup
import re
import json

def get_headers():
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    }

def test_scrape(url):
    print(f"Testing URL: {url}")
    try:
        response = requests.get(url, headers=get_headers(), timeout=15, allow_redirects=True)
        print(f"Final URL: {response.url}")
        print(f"Status Code: {response.status_code}")
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Save html for inspection
        with open('debug_flipkart.html', 'wb') as f:
            f.write(response.content)
            
        # Check for title
        title = soup.find('title')
        print(f"Page Title: {title.get_text() if title else 'N/A'}")
        
        # Check for specific selectors
        name = soup.find(class_='B_NuCI')
        print(f"Selector B_NuCI: {name.get_text() if name else 'NOT FOUND'}")
        
        # New Flipkart selectors (they change often)
        # Try to find any h1
        h1 = soup.find('h1')
        print(f"H1 tag: {h1.get_text() if h1 else 'NOT FOUND'}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_scrape("https://dl.flipkart.com/s/55OdhPuuuN")
