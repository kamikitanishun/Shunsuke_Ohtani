import requests
from bs4 import BeautifulSoup
import json

url = "https://www.dlsite.com/maniax/ranking/day/=/date/30d/category/voice"
headers = {"User-Agent": "Mozilla/5.0"}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, "html.parser")

rows = soup.select("table#ranking_table tr")
results = []

for row in rows:
    rank_tag = row.select_one("div.rank_no")
    title_tag = row.select_one("dt.work_name a")

    if rank_tag and title_tag:
        rank = rank_tag.get_text(strip=True)
        title = title_tag.get_text(strip=True)
        href = title_tag['href']

        # URLが絶対パスか相対パスかをチェック
        if href.startswith("http"):
            full_url = href
        else:
            full_url = "https://www.dlsite.com" + href

        results.append({
            "rank": rank,
            "title": title,
            "url": full_url
        })

    if len(results) >= 10:
        break

# JSONファイルに保存
with open("ranking.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)
