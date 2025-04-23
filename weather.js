async function fetchWeather(forceRefresh = false) {
    const weatherInfo = document.getElementById("weather-info");

    const saved = JSON.parse(localStorage.getItem("weatherData"));
    const now = Date.now();

    // 10分以上経ってる or 強制リフレッシュ時は再取得
    if (!forceRefresh && saved && now - saved.timestamp < 10 * 60 * 1000) {
        weatherInfo.textContent = saved.display;
        return;
    }

    try {
        console.log("🌍 IPアドレス取得中...");
        const ipResponse = await fetch("https://ipinfo.io/json?token=9c76948c8360a9");
        const ipData = await ipResponse.json();
        const [lat, lon] = ipData.loc.split(",");
        const timezone = ipData.timezone;

        console.log("✅ IPデータ:", ipData);

        const weatherApiKey = "698f1e1b55eb15604bd14ecde2cfc7b9";
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric&lang=ja`
        );
        const weatherData = await weatherResponse.json();

        const weatherIconMap = {
            "Thunderstorm": "⛈",
            "Drizzle": "🌦",
            "Rain": "🌧",
            "Snow": "❄️",
            "Clear": "☀️",
            "Clouds": "☁️",
            "Mist": "🌫",
            "Smoke": "🌫",
            "Haze": "🌫",
            "Dust": "🌫",
            "Fog": "🌫",
            "Sand": "🌫",
            "Ash": "🌫",
            "Squall": "🌪",
            "Tornado": "🌪"
        };

        const weatherMain = weatherData.weather[0].main;
        let weatherEmoji = weatherIconMap[weatherMain] || "❓";
        const temperature = Math.round(weatherData.main.temp);

        const timeResponse = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
        const timeData = await timeResponse.json();
        const localTime = new Date(timeData.datetime);
        const hours = localTime.getHours();
        const minutes = localTime.getMinutes().toString().padStart(2, "0");

        if (weatherEmoji === "☀️" && (hours >= 19 || hours < 6)) {
            weatherEmoji = "✨";
        }

        const display = `${ipData.city} ${hours}:${minutes} ${weatherEmoji} ${temperature}°C`;
        weatherInfo.textContent = display;

        // 保存
        localStorage.setItem("weatherData", JSON.stringify({
            display,
            timestamp: now
        }));
    } catch (error) {
        console.error("天気情報の取得に失敗:", error);
        weatherInfo.textContent = "天気情報を取得できません";
    }
}

document.addEventListener("DOMContentLoaded", () => fetchWeather());
