/**
 * Haversine distance + city coordinate database.
 * Mirrors lib/geography.ts exactly for Lambda use.
 */

const CITY_COORDINATES = {
  // India
  'mumbai':     { lat: 19.0760, lng: 72.8777 },
  'delhi':      { lat: 28.7041, lng: 77.1025 },
  'bangalore':  { lat: 12.9716, lng: 77.5946 },
  'bengaluru':  { lat: 12.9716, lng: 77.5946 },
  'hyderabad':  { lat: 17.3850, lng: 78.4867 },
  'chennai':    { lat: 13.0827, lng: 80.2707 },
  'kolkata':    { lat: 22.5726, lng: 88.3639 },
  'pune':       { lat: 18.5204, lng: 73.8567 },
  'ahmedabad':  { lat: 23.0225, lng: 72.5714 },
  'jaipur':     { lat: 26.9124, lng: 75.7873 },
  'surat':      { lat: 21.1702, lng: 72.8311 },
  'lucknow':    { lat: 26.8467, lng: 80.9462 },
  'kanpur':     { lat: 26.4499, lng: 80.3319 },
  'nagpur':     { lat: 21.1458, lng: 79.0882 },
  'indore':     { lat: 22.7196, lng: 75.8577 },
  'thane':      { lat: 19.2183, lng: 72.9781 },
  'bhopal':     { lat: 23.2599, lng: 77.4126 },
  'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
  'patna':      { lat: 25.5941, lng: 85.1376 },
  'vadodara':   { lat: 22.3072, lng: 73.1812 },
  'ghaziabad':  { lat: 28.6692, lng: 77.4538 },
  'ludhiana':   { lat: 30.9010, lng: 75.8573 },
  'agra':       { lat: 27.1767, lng: 78.0081 },
  'nashik':     { lat: 19.9975, lng: 73.7898 },
  'faridabad':  { lat: 28.4089, lng: 77.3178 },
  'meerut':     { lat: 28.9845, lng: 77.7064 },
  'rajkot':     { lat: 22.3039, lng: 70.8022 },
  'varanasi':   { lat: 25.3176, lng: 82.9739 },
  'srinagar':   { lat: 34.0837, lng: 74.7973 },
  'amritsar':   { lat: 31.6340, lng: 74.8723 },
  'chandigarh': { lat: 30.7333, lng: 76.7794 },
  'guwahati':   { lat: 26.1445, lng: 91.7362 },
  'kochi':      { lat: 9.9312, lng: 76.2673 },
  'coimbatore': { lat: 11.0168, lng: 76.9558 },
  'madurai':    { lat: 9.9252, lng: 78.1198 },
  'trivandrum': { lat: 8.5241, lng: 76.9366 },
  'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
  'mysore':     { lat: 12.2958, lng: 76.6394 },
  'mysuru':     { lat: 12.2958, lng: 76.6394 },
  'mangalore':  { lat: 12.9141, lng: 74.8560 },
  'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
  'raipur':     { lat: 21.2514, lng: 81.6296 },
  'ranchi':     { lat: 23.3441, lng: 85.3096 },
  'dehradun':   { lat: 30.3165, lng: 78.0322 },
  'shimla':     { lat: 31.1048, lng: 77.1734 },
  'jammu':      { lat: 32.7266, lng: 74.8570 },
  'goa':        { lat: 15.2993, lng: 74.1240 },
  'panaji':     { lat: 15.4909, lng: 73.8278 },
  // Global
  'new york':   { lat: 40.7128, lng: -74.0060 },
  'london':     { lat: 51.5074, lng: -0.1278 },
  'paris':      { lat: 48.8566, lng: 2.3522 },
  'tokyo':      { lat: 35.6762, lng: 139.6503 },
  'singapore':  { lat: 1.3521, lng: 103.8198 },
  'dubai':      { lat: 25.2048, lng: 55.2708 },
  'sydney':     { lat: -33.8688, lng: 151.2093 },
};

/**
 * Haversine formula — great-circle distance in km.
 */
function haversineDistance(coord1, coord2) {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getCityCoordinates(cityName) {
  return CITY_COORDINATES[cityName.toLowerCase().trim()];
}

function calculateCityDistance(city1, city2) {
  const c1 = getCityCoordinates(city1);
  const c2 = getCityCoordinates(city2);
  if (!c1 || !c2) return undefined;
  return haversineDistance(c1, c2);
}

function formatDistance(km) {
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

function getDistanceCategory(km) {
  if (km === 0) return 'same';
  if (km < 50) return 'near';
  if (km < 200) return 'far';
  return 'very-far';
}

module.exports = { haversineDistance, getCityCoordinates, calculateCityDistance, formatDistance, getDistanceCategory };
