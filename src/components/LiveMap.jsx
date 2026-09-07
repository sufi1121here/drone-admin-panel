import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { motion } from 'framer-motion';
import './LiveMap.css';

// Fix leaflet default icon issue in React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Emergency Red Pin
const emergencyIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Drone Icon
const droneIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3233/3233668.png', 
  iconSize: [44, 44],
  iconAnchor: [22, 22],
  popupAnchor: [0, -22],
});


const LiveMap = ({ token }) => {
  const [drones, setDrones] = useState([]);
  const [requests, setRequests] = useState([]);
  const domain = "http://localhost:5000";

  useEffect(() => {
    const fetchMapData = async () => {
      if (!token) return;
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const [droneRes, reqRes] = await Promise.all([
          axios.get(`${domain}/api/drones`, config),
          axios.get(`${domain}/api/drone-requests`, config)
        ]);
        
        setDrones(droneRes.data);
        
        // Only show emergencies that are active and have coordinates
        const activeRequests = reqRes.data.filter(r => 
          (r.status === 'pending' || r.status === 'accepted') && r.latitude && r.longitude
        );
        setRequests(activeRequests);
      } catch (err) {
        console.error("Error fetching map data:", err);
      }
    };

    fetchMapData();
    // Poll the backend every 2 seconds to animate the drones smoothly
    const interval = setInterval(fetchMapData, 2000); 
    
    return () => clearInterval(interval);
  }, [token]);

  return (
    <motion.div 
      className="map-container"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <MapContainer 
        center={[24.8086, 67.1209]} 
        zoom={12} 
        style={{ height: '100%', width: '100%', borderRadius: '20px' }}
      >
        {/* Dark-themed premium map tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />

        {/* Base Station */}
        <Marker position={[24.8086, 67.1209]}>
          <Popup>🏥 Base Station (Command Center)</Popup>
        </Marker>

        {/* Emergency Locations */}
        {requests.map(req => (
          <Marker 
            key={req._id} 
            position={[req.latitude, req.longitude]}
            icon={emergencyIcon}
          >
            <Popup>
              <strong>{req.category || 'Emergency'}</strong><br/>
              User: {req.userName}<br/>
              Status: <span style={{color: req.status === 'accepted' ? 'green' : 'orange'}}>{req.status}</span>
            </Popup>
          </Marker>
        ))}

        {/* Simulated Drone Fleet */}
        {drones.map(drone => (
          <Marker
            key={drone.id}
            position={[drone.location.lat, drone.location.lng]}
            icon={droneIcon}
          >
            <Popup>
              <strong>🚁 {drone.id}</strong><br/>
              Status: {drone.status}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </motion.div>
  );
};

export default LiveMap;
