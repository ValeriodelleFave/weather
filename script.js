const API = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m";
const searchAPI = "https://geocoding-api.open-meteo.com/v1/search"

async function search() {
    let name = document.getElementById("city").value;
    if (name.length < 3) {
        return;
    }
    const response = await fetch(searchAPI + "?name=" + name, {
        method: "GET",
    });
    const raw = await response.json();
    if (!("results" in raw)) {
        return
    }
    document.getElementById("container").innerHTML = "";
    const select = document.createElement("select")
    select.id = "search";
    const option = document.createElement("option");
    option.text = "";
    option.value = null;
    select.appendChild(option);
    for (const city of raw.results) {
        const option = document.createElement("option");
        option.text = city.name;
        option.value = [city.latitude, city.longitude, city.name];
        select.appendChild(option);
    }
    select.onchange = () => { getData() }
    document.getElementById("container").appendChild(select);
}

async function getData() {
    const [latitude, longitude, name] = document.getElementById("search").value.split(",");
    const response = await fetch(`${API}&latitude=${latitude}&longitude=${longitude}`, {
        method: "GET",
    });
    const raw = await response.json();

    document.getElementById("weather-title").innerHTML = name;

    const days = [];

    for (let index = 0, mapIndex = 0; index < raw.hourly.time.length; index++) {
        if (index == 0) {
            const map = new Map()
            map.set(raw.hourly.time[index], raw.hourly.temperature_2m[index]);
            days.push(map);
        } else if (index % 24 == 0) {
            const map = new Map();
            map.set(raw.hourly.time[index], raw.hourly.temperature_2m[index]);
            days.push(map);
            mapIndex++;
        } else {
            days[mapIndex].set(raw.hourly.time[index], raw.hourly.temperature_2m[index]);
        }
    }

    let html = "";
    for (const day of days) {
        html += `<div class="day">`;
        day.forEach((temperature, hour) => {
            html += `<p class="hour">${getFormattedDate(new Date(hour))} : ${temperature}</p>`;
        })
        html += `</div>`;
    }

    document.getElementById("weather-container").innerHTML = html;
}

/**
 * 
 * @param {Date} date 
 * @returns {string}
 */
function getFormattedDate(date) {
    return `${date.getDate()}/${(date.getMonth() + 1)} - ${date.getHours()}`;
} 