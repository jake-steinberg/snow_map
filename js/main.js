let map;
let pointLayer;
let geoJson = {
    type: "FeatureCollection",
    name: "nwsStations",
    features: []
};

function createMap(){
    //create basemap
    map = L.map('map', {
        center: [46.15, -95.196],
        zoom: 7,
        scrollWheelZoom: true,
    });

    L.mapbox.accessToken = 'pk.eyJ1Ijoic3RhcnRyaWJ1bmUiLCJhIjoiY2sxYjRnNjdqMGtjOTNjcGY1cHJmZDBoMiJ9.St9lE8qlWR5jIjkPYd3Wqw'

    L.tileLayer('https://api.mapbox://styles/startribune/clcgjfkha001c15t7txvk5isf/tiles/{z}/{x}/{y}?access_token=' + L.mapbox.accessToken, {
        tileSize: 512,
        zoomOffset: -1,
        attribution: '© <a href="https://www.mapbox.com/contribute/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    getData();
};


async function getData() {
    try {
        const response = await fetch('./data/statewide_snow.json');
        const snowData = await response.json();
        for (let point of snowData) {
            let coordinate = [(!isNaN(point.lon)) ? parseFloat(point.lon) : 0, (!isNaN(point.lat)) ? parseFloat(point.lat) : 0];
            let properties = point;
            delete properties.lon;
            delete properties.lat;
            let feature = {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": coordinate},
                "properties": properties
            };
            geoJson.features.push(feature);
        }
        // Replace with actual function to add data to the map
        // e.g., L.geoJson(geoJson).addTo(map);
        console.log(geoJson);
        L.geoJson(geoJson).addTo(map)
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

document.addEventListener('DOMContentLoaded',createMap);