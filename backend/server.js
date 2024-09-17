const express = require('express');
const cors = require('cors');
const turf = require('@turf/turf');
const { createNoise2D } = require('simplex-noise');
const { Delaunay } = require('d3-delaunay');

const app = express();
app.use(cors());

function generateCity(size = 25) {
    // Generate terrain using Simplex noise
    const noise2D = createNoise2D();
    const terrainNoise = Array.from({ length: size }, (_, y) =>
      Array.from({ length: size }, (_, x) => noise2D(x / 10, y / 10))
    );
  
  // Generate main roads using L-system
  const mainRoads = generateLSystemRoads(size);
  
  // Generate areas using Voronoi diagram
  const areas = generateVoronoiAreas(size, mainRoads);
  
  // Generate secondary roads
  const secondaryRoads = generateSecondaryRoads(size, mainRoads, areas);
  
  return {
    terrain: terrainNoise,
    roads: [...mainRoads, ...secondaryRoads],
    areas: areas
  };
}

function generateLSystemRoads(size) {
  // Implement L-system for road generation
  // This is a simplified version
  const roads = [];
  const iterations = 3;
  let currentRoad = [[0, size/2], [size, size/2]];
  
  for (let i = 0; i < iterations; i++) {
    const newRoads = [];
    for (const road of currentRoad) {
      const [start, end] = road;
      const mid = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      newRoads.push([start, mid]);
      newRoads.push([mid, end]);
      
      // Add a perpendicular road
      const perpLength = size / (2 ** (i + 1));
      const perp = [mid[0], mid[1] + perpLength];
      newRoads.push([mid, perp]);
    }
    currentRoad = newRoads;
  }
  
  return currentRoad.map(road => ({ start: road[0], end: road[1], type: 'main' }));
}

function generateVoronoiAreas(size, roads) {
  const pointCount = 50;
  const points = Array.from({ length: pointCount }, () => [Math.random() * size, Math.random() * size]);
  
  const delaunay = Delaunay.from(points);
  const voronoi = delaunay.voronoi([0, 0, size, size]);
  
  return Array.from(voronoi.cellPolygons()).map((cell, i) => ({
    polygon: cell,
    type: assignAreaType(cell, roads)
  }));
}

function assignAreaType(cell, roads) {
  const center = turf.centroid(turf.polygon([cell]));
  const nearRoad = roads.some(road => 
    turf.distance(center, turf.lineString([road.start, road.end])) < 0.5
  );
  
  if (nearRoad) {
    return Math.random() < 0.7 ? 'Residential' : 'Commercial';
  } else {
    return Math.random() < 0.5 ? 'Farm' : 'Park';
  }
}

function generateSecondaryRoads(size, mainRoads, areas) {
  // Implement logic to generate secondary roads based on areas and main roads
  // This is a placeholder implementation
  return areas.flatMap(area => {
    if (area.type === 'Residential' || area.type === 'Commercial') {
      const center = turf.centroid(turf.polygon([area.polygon]));
      const nearestMainRoad = turf.nearestPoint(center, turf.featureCollection(mainRoads.map(road => turf.lineString([road.start, road.end]))));
      return [{
        start: center.geometry.coordinates,
        end: nearestMainRoad.geometry.coordinates,
        type: 'secondary'
      }];
    }
    return [];
  });
}

app.get('/generate-city', (req, res) => {
  const city = generateCity();
  res.json(city);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));