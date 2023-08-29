const API = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m";
const searchAPI = "https://geocoding-api.open-meteo.com/v1/search";
const days = [];
const MONTHS = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

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

    const hours = raw.hourly;
    for (let index = 0, mapIndex = 0; index < hours.time.length; index++) {
        if (index == 0) {
            const map = new Map();
            map.set(hours.time[index], hours.temperature_2m[index]);
            days.push(map);
        } else if (index % 24 == 0) {
            const map = new Map();
            map.set(hours.time[index], hours.temperature_2m[index]);
            days.push(map);
            mapIndex++;
        } else {
            days[mapIndex].set(hours.time[index], hours.temperature_2m[index]);
        }
    }

    const select = document.createElement("select");
    buildSelectOptions(select);
    document.getElementById("days-container").appendChild(select);
}

/** @param {HTMLSelectElement} select */
function buildSelectOptions(select) {
    resetData("days-container", "weather-container");
    select.id = "selected-day";
    select.innerHTML = "";
    select.onchange = () => buildHourComponents();
    select.appendChild(getNullOption());
    for (const [index, day] of days.entries()) {
        const option = document.createElement("option");
        option.text = getFormattedOptionDate(new Date(day.entries().next().value[0]));
        option.value = index;
        select.appendChild(option);
    }
}

function buildHourComponents() {
    resetData("weather-container");
    const day = days[document.getElementById("selected-day").value];
    day.forEach((temperature, hour) => {
        const span = document.createElement("p");
        span.className = "hour";
        if (temperature <= 18) {
            span.className += " cold";
        } else if (temperature > 30) {
            span.className += " hot";
        }
        span.innerHTML = `${getFormattedHour(new Date(hour))} : ${temperature + "°"}`;
        document.getElementById("weather-container").appendChild(span);
    })
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