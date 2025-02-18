import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.js';
import axios from 'axios';
import '@fortawesome/fontawesome-free/css/all.css';
import './styles.css';
import image from './icons8-location-48.png'; // Assurez-vous que l'image existe

function MapComponent({ userPosition, parkings, selectedParking, setSelectedParking, mapRef }) {
  useEffect(() => {
    // Déclaration du parkingIcon avant son utilisation
    const parkingIcon = new L.Icon({
      iconUrl: image,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    if (!mapRef.current) {
      const map = L.map('map').setView([userPosition[0], userPosition[1]], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);
      map.attributionControl.setPrefix('');
      mapRef.current = map;

      map.locate({ setView: true, maxZoom: 16 });
      map.on('locationfound', onLocationFound);
      map.on('locationerror', onLocationError);

      // Ajout des marqueurs pour chaque parking
      parkings.forEach((parking) => {
        const marker = L.marker(parking.position, { icon: parkingIcon }).addTo(map)
          .bindPopup(`
            <div>
              <h4>Parking ${parking.id}</h4>
              <p>Disponibilité: ${parking.available ? 'Disponible' : 'Indisponible'}</p>
              <a href="#" onclick="window.alert('Itinéraire vers ${parking.id} non encore implémenté')">
                <i class="fas fa-directions" style="font-size: 24px; color: blue;"></i>
              </a>
            </div>
          `)
          .on('click', () => handleParkingClick(parking));

        if (!parking.available) {
          marker.setIcon(L.divIcon({ className: 'unavailable-parking-icon' }));
        }
      });
    }

    function onLocationFound(e) {
      // Ne rien faire ici car userPosition est géré par le parent
    }

    function onLocationError(e) {
      alert(e.message);
    }

    const handleParkingClick = (parking) => {
      setSelectedParking(parking); // Définit le parking sélectionné
    };
  }, [parkings, mapRef, userPosition, setSelectedParking]);

  return <div id="map" style={{ height: '600px' }} />;
}

function App() {
  const [userPosition] = useState([51.505, -0.09]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [parkings] = useState([
    { id: 1, position: [46.37629745513265, -72.55098771538326], available: true },
    { id: 2, position: [46.36246045301121, -72.59305615771119], available: true },
    { id: 3, position: [46.38968680709353, -72.52513566935102], available: true },
    { id: 4, position: [46.356521965413386, -72.58825980003915], available: true },
    { id: 5, position: [46.35399061645085, -72.56201493072727], available: true },
    { id: 6, position: [46.3501221406829, -72.58067778469511], available: true },
  ]);

  const mapRef = useRef(null);

  // Initialiser la carte dans un `useEffect` distinct
  useEffect(() => {
    if (!mapRef.current) {
      console.log('Carte initialisée');
    }
  }, [mapRef]);

  useEffect(() => {
    const calculateRoute = async (origin, destination) => {
      // Ajout du paramètre `geometries=geojson` pour s'assurer que nous recevons la géométrie
      const apiUrl = `http://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson&steps=true`;
  
      try {
        const response = await axios.get(apiUrl);
        console.log("Données reçues de l'API OSRM:", response.data); // Affiche la réponse complète
        return response.data;
      } catch (error) {
        console.error("Erreur lors de la requête à OSRM:", error);
        return null;
      }
    };
  
    const drawRoute = async () => {
      if (!mapRef.current) {
        console.error("La carte n'est pas encore initialisée.");
        return;
      }
  
      if (userPosition && selectedParking) {
        const routeData = await calculateRoute(userPosition, selectedParking.position);
  
        if (routeData && routeData.routes && routeData.routes.length > 0) {
          const firstRoute = routeData.routes[0];
  
          // Vérification si `geometry` et `coordinates` sont bien présents
          if (firstRoute.geometry && firstRoute.geometry.coordinates) {
            const routeCoordinates = firstRoute.geometry.coordinates.map(
              (coord) => [coord[1], coord[0]]
            );
            console.log("Coordonnées de l'itinéraire:", routeCoordinates);
  
            L.polyline(routeCoordinates, { color: 'blue' }).addTo(mapRef.current);
            mapRef.current.setView(selectedParking.position, 13);
          } else {
            console.error("Les données d'itinéraire ne contiennent pas de géométrie valide.");
          }
        } else {
          console.error("Aucun itinéraire trouvé ou la structure de la réponse est incorrecte.");
        }
      } else {
        console.error("Les données nécessaires pour tracer l'itinéraire ne sont pas disponibles.");
      }
    };
  
    if (selectedParking && mapRef.current) {
      drawRoute();
    }
  }, [userPosition, selectedParking]);

  return (
    <div>
      <MapComponent
        userPosition={userPosition}
        parkings={parkings}
        selectedParking={selectedParking}
        setSelectedParking={setSelectedParking}
        mapRef={mapRef}
      />
    </div>
  );
}

export default App;
