const WEATHER_CACHE_KEY = "weatherData";
const WEATHER_CACHE_MAX_AGE = 10 * 60 * 1000;
let weatherClockTimer = null;

const DEFAULT_LOCATION = {
  city: "東京",
  latitude: 35.681236,
  longitude: 139.767125,
  timezone: "Asia/Tokyo"
};

const WEATHER_CODE_EMOJI = new Map([
  [0, "☀️"],
  [1, "🌤"],
  [2, "⛅"],
  [3, "☁️"],
  [45, "🌫"],
  [48, "🌫"],
  [51, "🌦"],
  [53, "🌦"],
  [55, "🌦"],
  [56, "🌧"],
  [57, "🌧"],
  [61, "🌧"],
  [63, "🌧"],
  [65, "🌧"],
  [66, "🌧"],
  [67, "🌧"],
  [71, "❄️"],
  [73, "❄️"],
  [75, "❄️"],
  [77, "❄️"],
  [80, "🌦"],
  [81, "🌧"],
  [82, "🌧"],
  [85, "❄️"],
  [86, "❄️"],
  [95, "⛈"],
  [96, "⛈"],
  [99, "⛈"]
]);

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

function getSavedWeather() {
  try {
    return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY));
  } catch (error) {
    try {
      localStorage.removeItem(WEATHER_CACHE_KEY);
    } catch (storageError) {
      console.warn("天気情報キャッシュの削除に失敗:", storageError);
    }
    return null;
  }
}

function isValidSavedWeather(saved) {
  return saved
    && typeof saved.city === "string"
    && typeof saved.timezone === "string"
    && typeof saved.weatherEmoji === "string"
    && Number.isFinite(saved.temperature)
    && Number.isFinite(saved.timestamp);
}

function saveWeather(weather) {
  try {
    localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
      ...weather,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn("天気情報の保存に失敗:", error);
  }
}

async function getLocation() {
  const providers = [
    async () => {
      const ipData = await fetchJson("https://ipwho.is/");

      if (ipData.success === false || !ipData.latitude || !ipData.longitude) {
        throw new Error(ipData.message || "位置情報がありません");
      }

      return {
        city: ipData.city || DEFAULT_LOCATION.city,
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        timezone: ipData.timezone?.id || DEFAULT_LOCATION.timezone
      };
    },
    async () => {
      const ipData = await fetchJson("https://ipinfo.io/json?token=9c76948c8360a9");

      if (!ipData.loc) {
        throw new Error("位置情報がありません");
      }

      const [latitude, longitude] = ipData.loc.split(",");

      return {
        city: ipData.city || DEFAULT_LOCATION.city,
        latitude,
        longitude,
        timezone: ipData.timezone || DEFAULT_LOCATION.timezone
      };
    },
    async () => {
      const ipData = await fetchJson("https://ipapi.co/json/");

      if (ipData.error || !ipData.latitude || !ipData.longitude) {
        throw new Error(ipData.reason || "位置情報がありません");
      }

      return {
        city: ipData.city || DEFAULT_LOCATION.city,
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        timezone: ipData.timezone || DEFAULT_LOCATION.timezone
      };
    }
  ];

  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      console.warn("IP位置情報APIの取得に失敗:", error);
    }
  }

  console.warn("IP位置情報を取得できません。東京の天気を表示します。");
  return DEFAULT_LOCATION;
}

async function getCurrentWeather(location) {
  const params = new URLSearchParams({
    latitude: location.latitude,
    longitude: location.longitude,
    current: "temperature_2m,weather_code,is_day",
    timezone: location.timezone
  });

  const weatherData = await fetchJson(`https://api.open-meteo.com/v1/forecast?${params}`);

  if (!weatherData.current) {
    throw new Error("天気データがありません");
  }

  return weatherData.current;
}

function formatLocalTime(timezone) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone
    }).format(new Date());
  } catch (error) {
    return new Intl.DateTimeFormat("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(new Date());
  }
}

function getWeatherEmoji(weatherCode, isDay) {
  const emoji = WEATHER_CODE_EMOJI.get(weatherCode) || "❓";
  return emoji === "☀️" && isDay === 0 ? "✨" : emoji;
}

function buildWeatherDisplay(weather) {
  const localTime = formatLocalTime(weather.timezone);
  return `${weather.city} ${localTime} ${weather.weatherEmoji} ${weather.temperature}°C`;
}

function scheduleWeatherClock() {
  window.clearTimeout(weatherClockTimer);

  const now = new Date();
  const delay = ((60 - now.getSeconds()) * 1000) - now.getMilliseconds() + 50;
  weatherClockTimer = window.setTimeout(() => fetchWeather(), Math.max(delay, 1000));
}

function renderWeather(weather) {
  const weatherInfo = document.getElementById("weather-info");

  if (!weatherInfo) {
    return;
  }

  weatherInfo.textContent = buildWeatherDisplay(weather);
  scheduleWeatherClock();
}

async function fetchWeather(forceRefresh = false) {
  const weatherInfo = document.getElementById("weather-info");

  if (!weatherInfo) {
    return;
  }

  const saved = getSavedWeather();
  const now = Date.now();

  if (!forceRefresh && isValidSavedWeather(saved) && now - saved.timestamp < WEATHER_CACHE_MAX_AGE) {
    renderWeather(saved);
    return;
  }

  try {
    const location = await getLocation();
    const currentWeather = await getCurrentWeather(location);
    const weather = {
      city: location.city,
      timezone: location.timezone,
      weatherEmoji: getWeatherEmoji(currentWeather.weather_code, currentWeather.is_day),
      temperature: Math.round(currentWeather.temperature_2m)
    };

    renderWeather(weather);
    saveWeather(weather);
  } catch (error) {
    console.error("天気情報の取得に失敗:", error);
    weatherInfo.textContent = "天気情報を取得できません";
    scheduleWeatherClock();
  }
}

document.addEventListener("DOMContentLoaded", () => fetchWeather());
