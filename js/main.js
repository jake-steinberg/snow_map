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

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    getData();
};

//function to retrieve the data and place it on the map
function getData(){
    //Papaparse library reads csvs - more info here: https://www.papaparse.com/
    Papa.parse('data/statewide_snow.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: results => {
            results.data.forEach(function(data){
                //creates feature to contain story data
                let feature = {}
                feature.type = "Feature";
                feature.properties = {};
                //for loop turns csv columns into feature properties
                for (const property in data){
                    feature.properties[property] = data[property];
                }
                //pushes feature into geoJson created at the beginning of the script, ensures feature has a value
                geoJson.features.push(feature)
                });
            //add data to the map
            pointLayer = L.geoJson(geoJson)
        }
    })
};




document.addEventListener('DOMContentLoaded',createMap)