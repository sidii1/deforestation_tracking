
var india = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017")
               .filter(ee.Filter.eq('country_na', 'India'));

// Load Sentinel-2 image collections for two time periods.
var before = ee.ImageCollection('COPERNICUS/S2')
               .filterBounds(india)
               .filterDate('2019-01-01', '2019-12-31')
               .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
               .median();

var after = ee.ImageCollection('COPERNICUS/S2')
              .filterBounds(india)
              .filterDate('2021-01-01', '2021-12-31')
              .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
              .median();

// Compute NDVI for both periods (using Sentinel-2's B8 (NIR) and B4 (Red)).
var ndviBefore = before.normalizedDifference(['B8', 'B4']).rename('NDVI');
var ndviAfter = after.normalizedDifference(['B8', 'B4']).rename('NDVI');

// Calculate NDVI difference (after - before).
var ndviDiff = ndviAfter.subtract(ndviBefore);

// Highlight deforested areas (where NDVI decreased significantly).
var deforestation = ndviDiff.lt(-0.2);  // Deforestation threshold.

// Add layers to the map.
Map.centerObject(india, 5);  // Adjust zoom level for India.
Map.addLayer(ndviBefore, {min: 0, max: 1, palette: ['white', 'green']}, 'NDVI Before');
Map.addLayer(ndviAfter, {min: 0, max: 1, palette: ['white', 'green']}, 'NDVI After');
Map.addLayer(deforestation.updateMask(deforestation), {palette: ['red']}, 'Deforested Areas');

// Optionally, export the deforestation layer to Google Drive.
Export.image.toDrive({
  image: deforestation,
  description: 'IndiaDeforestationMap',
  scale: 10,  // Higher resolution with Sentinel-2.
  region: india.geometry(),
  maxPixels: 1e9
});
