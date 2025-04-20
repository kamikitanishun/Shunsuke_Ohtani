import requests
from bs4 import BeautifulSoup
import json

url = "https://www.dlsite.com/maniax/ranking/day/=/date/30d/category/voice"
headers = {"User-Agent": "Mozilla/5.0"}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, "html.parser")
rows = soup.select("table#ranking_table tr")

ranking = []
count = 0

for row in rows:
    rank_tag = row.select_one("div.rank_no")
    title_tag = row.select_one("dt.work_name a")
    if rank_tag and title_tag:
        title = title_tag.get_text(strip=True)
        url = "https://www.dlsite.com" + title_tag["href"]
        ranking.append({
            "title": title,
            "link": url
        })
        count += 1
    if count >= 10:
        break

with open("ranking.json", "w", encoding="utf-8") as f:
    json.dump(ranking, f, ensure_ascii=False, indent=2)
