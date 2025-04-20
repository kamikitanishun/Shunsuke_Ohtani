import requests
from bs4 import BeautifulSoup
import json

url = "https://www.dlsite.com/maniax/ranking/day/=/date/30d/category/voice"
headers = {
    "User-Agent": "Mozilla/5.0"
}

response = requests.get(url, headers=headers)
soup = BeautifulSoup(response.content, "html.parser")

rows = soup.select("table#ranking_table tr")

ranking = []
count = 0

for row in rows:
    rank_tag = row.select_one("div.rank_no")
    title_tag = row.select_one("dt.work_name a")

    if rank_tag and title_tag:
        rank = rank_tag.get_text(strip=True)
        title = title_tag.get_text(strip=True)
        link = title_tag.get("href")
        if not link.startswith("http"):
            link = "https://www.dlsite.com" + link

        ranking.append({
            "title": f"{rank}位: {title}",
            "link": link
        })

        count += 1
        if count >= 5:
            break

# JSONとして保存
with open("ranking.json", "w", encoding="utf-8") as f:
    json.dump(ranking, f, ensure_ascii=False, indent=2)
