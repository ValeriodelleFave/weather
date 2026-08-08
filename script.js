const API = "https://api.open-meteo.com/v1/forecast?hourly=temperature_2m,precipitation_probability,weathercode";
const searchAPI = "https://geocoding-api.open-meteo.com/v1/search";
const WMO = {
    0: "wi-day-sunny", 1: "wi-day-cloudy", 2: "wi-cloud", 3: "wi-cloudy",
    45: "wi-fog", 48: "wi-day-fog", 51: "wi-sleet", 53: "wi-sleet", 55: "wi-sleet",
    56: "wi-rain-mix", 57: "wi-rain-mix", 61: "wi-showers", 63: "wi-showers",
    65: "wi-showers", 66: "wi-hail", 67: "wi-hail", 71: "wi-snow", 73: "wi-snow",
    75: "wi-snow", 77: "wi-snow", 80: "wi-sprinkle", 81: "wi-sprinkle",
    82: "wi-sprinkle", 85: "wi-snow-wind", 86: "wi-snow-wind", 95: "wi-thunderstorm",
    96: "wi-storm-showers", 99: "wi-storm-showers"
};

let searchTimeout = null;

function handleInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        search();
    }, 300); 
}

async function search() {
    resetData("search-container", "weather-title", "days-container", "weather-container");
    let name = document.getElementById("city").value;
    if (name.length < 3) return;
    
    const response = await fetch(searchAPI + "?name=" + name);
    const raw = await response.json();
    if (!("results" in raw)) return;

    let select = document.getElementById("search");
    if (!select) {
        select = document.createElement("select");
        select.id = "search";
        select.onchange = () => getData();
        document.getElementById("search-container").appendChild(select);
    }
    
    select.innerHTML = "";
    
    const defaultOption = document.createElement("option");
    defaultOption.text = "Select matching location...";
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    for (const city of raw.results) {
        const option = document.createElement("option");
        option.text = `${city.name} ${city.admin1 ? ", " + city.admin1 : ""} (${city.country || ""})`;
        option.value = [
            city.latitude, 
            city.longitude, 
            `${city.name} ${city.country ? " - " + city.country : ""}`
        ];
        select.appendChild(option);
    }
}

async function getData() {
    const val = document.getElementById("search").value;
    if (!val) return;

    const [latitude, longitude, name] = val.split(",");
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
            days.push([object]);
        } else if (index % 24 == 0) {
            days.push([object]);
            mapIndex++;
        } else {
            days[mapIndex].push(object);
        }
    }

    resetData("days-container", "weather-container");
    
    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        
        // Calculate median for the day
        const median = getMedianTemperature(day).toFixed(1);
        
        const button = document.createElement("button");
        button.className = "day";
        
        // Inject both the date and the median temperature into the button
        button.innerHTML = `
            <div class="day-date">${getFormattedOptionDate(new Date(day[0].time))}</div>
            <div class="day-median">Media: ${median}°C</div>
        `;
        
        button.onclick = () => { 
            document.querySelectorAll('.day').forEach(btn => btn.classList.remove('active'));
            // Use 'button' instead of 'e.target' so clicking the inner divs doesn't break the active class
            button.classList.add('active'); 
            buildHourComponents(day); 
        };
        
        document.getElementById("days-container").appendChild(button);

        if (i === 0) {
            button.classList.add('active');
            buildHourComponents(day);
        }
    }
}

// Math helper to find the median temperature
function getMedianTemperature(hours) {
    // Extract temperatures and sort them numerically
    const temps = hours.map(hour => hour.temperature_2m).sort((a, b) => a - b);
    const mid = Math.floor(temps.length / 2);
    
    // If array length is even, median is average of the two middle numbers
    if (temps.length % 2 === 0) {
        return (temps[mid - 1] + temps[mid]) / 2;
    }
    return temps[mid];
}

function buildHourComponents(hours) {
    resetData("weather-container");
    const table = document.createElement("table");

    const tr = document.createElement("tr");
    for (const key of ["Time", "Conditions", "Temp", "Rain %"]) {
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
                    if (hour[key] >= 30) {
                        td.className = "hot";
                    } else if(hour[key] <= 10) {
                        td.className = "cold";
                    }
                    td.textContent = hour[key] + "°C";
                    break;
                case "precipitation_probability":
                    td.textContent = hour[key] > 0 ? hour[key] + "%" : "-";
                    break;
            }
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }
    document.getElementById("weather-container").appendChild(table);
}

function getFormattedHour(date) {
    return date.getHours().toString().padStart(2, '0') + ":00";
}

function getFormattedOptionDate(date) {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function resetData(...targets) {
    for (const target of targets) {
        document.getElementById(target).innerHTML = "";
    }
}