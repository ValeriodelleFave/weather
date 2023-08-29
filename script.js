const API = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,precipitation_probability,weathercode";
const searchAPI = "https://geocoding-api.open-meteo.com/v1/search";
const WMO = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "partly cloudy",
    3: "and overcast",
    45: "Fog",
    48: "depositing rime fog",
    51: "Drizzle Light",
    53: "Drizzle moderate",
    55:	"Drizzle: dense intensity",
    56: "Freezing Drizzle: Light intensity", 
    57: "Freezing Drizzle dense intensity",
    61: "Rain: Slight intensity", 
    63: "Rain: moderate intensity", 
    65: "Rain: heavy intensity",	
    66: "Freezing Rain: Light intensity", 
    67: "Freezing Rain: heavy intensity",
    71: "Snow fall: Slight intensity", 
    73: "Snow fall: moderate intensity", 
    75: "Snow fall: heavy intensity",
    77:	"Snow grains",
    80: "Rain showers: Slight", 
    81: "Rain showers: moderate", 
    82: "Rain showers: violent", 
    85: "Snow showers slight", 
    86: "Snow showers heavy", 
    95: "Thunderstorm: Slight or moderate",
    96:	"Thunderstorm with slight hail",
    99:	"Thunderstorm with heavy hail"
};

async function search() {
    resetData("search-container", "weather-title", "days-container", "weather-container");
    let name = document.getElementById("city").value;
    if (name.length < 3) {
        return;
    }
    const response = await fetch(searchAPI + "?name=" + name);
    const raw = await response.json();
    if (!("results" in raw)) {
        resetData("search-container", "weather-title", "days-container", "weather-container");
        return;
    }
    const select = document.createElement("select");
    select.id = "search";
    select.appendChild(getNullOption());
    for (const city of raw.results) {
        const option = document.createElement("option");
        option.text = city.name;
        option.value = [city.latitude, city.longitude, city.name];
        select.appendChild(option);
    }
    select.onchange = () => getData();
    document.getElementById("search-container").appendChild(select);
}

async function getData() {
    const [latitude, longitude, name] = document.getElementById("search").value.split(",");
    const response = await fetch(`${API}&latitude=${latitude}&longitude=${longitude}`);
    const raw = await response.json();

    document.getElementById("weather-title").innerHTML = name;
    const days = [];
    const hours = raw.hourly;
    for (let index = 0, mapIndex = 0; index < hours.time.length; index++) {
        const object = new Object();
        for (const key in hours) {
            object[key] = hours[key][index];
        }
        if (index == 0) {
            const day = [];
            day.push(object);
            days.push(day);
        } else if (index % 24 == 0) {
            const day = [];
            day.push(object);
            days.push(day);
            mapIndex++;
        } else {
            days[mapIndex].push(object);
        }
    }

    resetData("days-container");
    for (const [index, day] of days.entries()) {
        const button = document.createElement("button");
        button.textContent = getFormattedOptionDate(new Date(day[0].time));
        button.onclick = () => { buildHourComponents(day) };
        document.getElementById("days-container").appendChild(button);
    }
}

function buildHourComponents(hours, index) {
    resetData("weather-container");
    for (const hour of hours) {
        const span = document.createElement("p");
        for (const key in hour) {
            span.className = "hour";
            if (key == "weathercode") {
                span.innerHTML += `${WMO[hour[key]]} `;
            } else if (key == "time") {
                span.innerHTML += `${getFormattedHour(new Date(hour[key]))} `;
            } else if (key == "temperature_2m") {
                span.innerHTML += `${hour[key]} °C`;
            } else {
                span.innerHTML += `${hour[key]} `;
            }
        }
        document.getElementById("weather-container").appendChild(span);
    }
}

/**
 * 
 * @param {Date} date 
 * @returns {string}
 */
function getFormattedHour(date) {
    return date.getHours();
}
/**
 * 
 * @param {Date} date 
 * @returns {string}
 */
function getFormattedOptionDate(date) {
    const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function getNullOption() {
    const option = document.createElement("option");
    option.text = "";
    option.value = null;
    return option;
}

function resetData(...targets) {
    for (const target of targets) {
        document.getElementById(target).innerHTML = "";
    }
}