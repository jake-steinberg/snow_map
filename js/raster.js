import {contours} from "https://cdn.jsdelivr.net/npm/d3-contour@4/+esm";

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

//Snowgrid data //

//use geoTIFF library to load raster image
async function getRaster(){
    let tiff = await GeoTIFF.fromUrl("./data/snowgrid.tif"),
        image = await tiff.getImage(),
        //get height and width to convert image pixels to coordiates
        h = image.getHeight(),
        w = image.getWidth(),
        //get values to create contours
        values = await image.readRasters({interleave: true});

    //get bounding box to convert image pixels to coordinates
    let bb = image.getBoundingBox(),
        maxLng = bb[2],
        minLng = bb[0],
        maxLat = bb[3],
        minLat = bb[1];

    //D3-contour method to create contour polygons from snowgrid
    let tiffData = contours()
        .size([w, h])
        .smooth(false)
        //thresholds nicked from NOAA map scale
        .thresholds([0,.1,1,2,6,12,24,36,48,72,96,120,180,240,360,480,600])
        (values)

    //loop through tiffData arrays to convert pixels to coordinates
    let geojsonData = tiffData.map((multi_polygon) => ({
        ...multi_polygon,
        coordinates: multi_polygon.coordinates.map((coordinate_set) =>
          coordinate_set.map((coordinate_subset) =>
            coordinate_subset.map((coordinate_pair) => {return[
                minLng + (maxLng - minLng) * (coordinate_pair[0] / w),
                maxLat - (maxLat - minLat) * (coordinate_pair[1] / h),
            ]})
          ))
      }))

    //check to see if any latitude values are out of bounds
    geojsonData.forEach((multi_polygon) => {
    multi_polygon.coordinates.forEach((coordinate_set) => {
        coordinate_set.forEach((coordinate_subset) => {
        coordinate_subset.forEach((coordinate_pair) => {
            if (coordinate_pair[1] < -90) {
                console.log(coordinate_pair)
            } else if (coordinate_pair[1] > 90) {
                console.log(coordinate_pair)
            }});
        });
    });
    })

    //create a geojson feature to push the data into
    let resultgeojson = {
        type: 'FeatureCollection',
        features: []
    };
    geojsonData.forEach((multiPolygon) => {
        resultgeojson.features.push({
            type: 'Feature',
            properties: {
                value: multiPolygon.value,
                idx: 0
            },
            geometry: {
                type: 'Polygon',
                coordinates: multiPolygon.coordinates
            }
        });
    });

    console.log(resultgeojson)
    //saveToFile(resultgeojson, 'test')
};

//function to export a geojson file for testing
function saveToFile(content, filename) {
    var file = filename + '.geojson';
    saveAs(new File([JSON.stringify(content)], file, {
      type: "text/plain;charset=utf-8"
    }), file);
  }

// ACIS data //

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
    getRaster();
}

//adds NWS points to map.
map.on('load',  () => {
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

