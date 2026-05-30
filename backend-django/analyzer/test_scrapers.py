import requests
from bs4 import BeautifulSoup
import re
import json
from urllib.parse import quote

session = requests.Session()

def test_amazon(query):
    print(f"Testing Amazon: {query}")
    url = f"https://www.amazon.in/s?k={quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    }
    try:
        response = session.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        # print(f"Content snippet: {response.text[:200]}")
        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.select("div[data-component-type='s-search-result']")
        print(f"Items found: {len(items)}")
    except Exception as e:
        print(f"Error: {e}")

def test_flipkart(query):
    print(f"Testing Flipkart: {query}")
    url = f"https://www.flipkart.com/search?q={quote(query)}"
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = session.get(url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        soup = BeautifulSoup(response.text, "html.parser")
        items = soup.select("div[data-id]")
        print(f"Items found: {len(items)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_amazon("saree")
    test_flipkart("saree")
