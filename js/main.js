//declare geoJSON variable to push features into.
let geoJson = {
    type: "FeatureCollection",
    name: "nwsStations",
    features: []
};

//mapbox access token.
const token = "pk.eyJ1Ijoic3RhcnRyaWJ1bmUiLCJhIjoiY2xiNWF4OHFoMDRzczNybzEyMXFteTZ1YiJ9.WGjxTW63c5_XCbtZ5f8Yyw";

//create the map.
const map = new mapboxgl.Map({
        //create basemap
        container: 'map',
        style: 'mapbox://styles/startribune/ck1b7427307bv1dsaq4f8aa5h',
        center: [-95.196, 46.15],
        zoom: 7,
        scrollZoom: true,
        accessToken: token
    });

//converts statewide_snow.json into a geojson.
async function getData(){
    try {
        const response = await fetch('./data/statewide_snow.json');
        const data = await response.json();
        for (let point of data) {
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
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

//adds NWS points to map.
map.on('load',  () => {
    console.log(geoJson)
    // Add GeoJSON source
    map.addSource("NWS-stations", {
        type: "geojson",
        data: geoJson
    });
    // Add a symbol layer for labels
    map.addLayer({
        'id': 'station-labels',
        'type': 'symbol',
        'source': 'NWS-stations',
        'layout': {
            'text-field': [
                'format',
                ['get', 'name'],
                { 'font-scale': 0.8 },
                '\n',
                {},
                ['get', 'current_total_snowfall'],
                { 'font-scale': 0.6 }, 
                ' in.',
                { 'font-scale': 0.6 }
                ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-offset': [0, .5],
            'text-anchor': 'top'       
        }
    })
    // Add a circle layer for points, colored based on total seasonal snowfall
    map.addLayer({
        'id': 'station-points',
        'type': 'circle',
        'source': 'NWS-stations',
        'paint': {
            "circle-stroke-color": "#000000",
            "circle-stroke-width": 1,
            "circle-color": [
                'interpolate',
                ['linear'],
                ['get', 'current_total_snowfall'],
                0,
                ['to-color', '#f5e5f3', '#ffffff'],
                10,
                ['to-color', '#8d00ac', '#ffffff']
            ]
        }
    })
})

//adding some relief and hillshade
map.on('style.load', () => {
    map.addSource('mapbox-dem', {
    'type': 'raster-dem',
    'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
    'tileSize': 512,
    'maxzoom': 14
    });
    // add the DEM source as a terrain layer with exaggerated height
    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 3.5 });
});
map.on('load', () => {
        map.addSource('dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1'
        });
        map.addLayer({
            'id': 'hillshading',
            'source': 'dem',
            'type': 'hillshade'
        },
        // Insert below land-structure-polygon layer,
        // where hillshading sits in the Mapbox Streets style.
        'land-structure-polygon'
        );
});


document.addEventListener('DOMContentLoaded',getData)

