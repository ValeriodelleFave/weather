const API = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,precipitation_probability,weathercode";
const searchAPI = "https://geocoding-api.open-meteo.com/v1/search";
const WMO = {
    0: "wi-day-sunny",
    1: "wi-day-cloudy",
    2: "wi-cloud",
    3: "wi-cloudy",
    45: "wi-fog",
    48: "wi-day-fog",
    51: "wi-sleet",
    53: "wi-sleet",
    55: "wi-sleet",
    56: "wi-rain-mix",
    57: "wi-rain-mix",
    61: "wi-showers",
    63: "wi-showers",
    65: "wi-showers",
    66: "wi-hail",
    67: "wi-hail",
    71: "wi-snow",
    73: "wi-snow",
    75: "wi-snow",
    77: "wi-snow",
    80: "wi-sprinkle",
    81: "wi-sprinkle",
    82: "wi-sprinkle",
    85: "wi-snow-wind",
    86: "wi-snow-wind",
    95: "wi-thunderstorm",
    96: "wi-storm-showers",
    99: "wi-storm-showers"
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

    const select = document.getElementById("search") ? document.getElementById("search") : document.createElement("select");
    select.id = "search";
    select.onchange = () => getData();
    select.innerHTML = "";
    select.appendChild(getNullOption());
    for (const city of raw.results) {
        const option = document.createElement("option");
        option.text = `${city.name} - ${city.country}`;
        option.value = [city.latitude, city.longitude, `${city.name} ${city.country ? "- " + city.country : ""} ${city.admin1 ? "- " + city.admin1 : ""} ${city.admin3 ? "- " + city.admin3 : ""}`];
        select.appendChild(option);
    }
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
    for (const day of days) {
        const button = document.createElement("button");
        button.textContent = getFormattedOptionDate(new Date(day[0].time));
        button.onclick = () => { buildHourComponents(day) };
        document.getElementById("days-container").appendChild(button);
    }
}

function buildHourComponents(hours, index) {
    resetData("weather-container");
    const table = document.createElement("table");

    const tr = document.createElement("tr");
    for (const key of ["Ora", "Tempo", "Temperatura", "Precipitazioni"]) {
        const th = document.createElement("th");
        th.textContent = key;
        tr.appendChild(th);
    }
    table.appendChild(tr);

    for (const hour of hours) {
        const tr = document.createElement("tr");
        for (const key of ["time", "weathercode", "temperature_2m", "precipitation_probability"]) {
            const td = document.createElement("td");
            switch (key) {
                case "time":
                    td.textContent = getFormattedHour(new Date(hour[key]));
                    break;
                case "weathercode":
                    let icon = document.createElement("img");
                    icon.src = "./icons/" + WMO[hour[key]] + ".svg";
                    td.appendChild(icon);
                    break;
                case "temperature_2m":
                    td.textContent = hour[key] + "°C";
                    break;
                case "precipitation_probability":
                    td.textContent = hour[key] + "%";
                    break;
                default:
                    break;
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    document.getElementById("weather-container").appendChild(table);
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
    return `${date.getDate()}/${date.getMonth()}`;
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