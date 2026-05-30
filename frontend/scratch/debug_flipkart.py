from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
import time

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(
    service=Service(ChromeDriverManager().install()),
    options=options
)

try:
    url = "https://www.flipkart.com/search?q=Noise+Airwave+Max+4"
    driver.get(url)
    time.sleep(5) # wait for js
    
    soup = BeautifulSoup(driver.page_source, "html.parser")
    items = soup.select("div[data-id]")
    
    if items:
        print("FOUND ITEM HTML:")
        print(items[0].prettify()[:2000])
    else:
        print("NO ITEMS FOUND")

finally:
    driver.quit()
