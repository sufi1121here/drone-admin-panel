import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Battery, BatteryCharging, Navigation, CheckCircle, Activity, Crosshair } from 'lucide-react';
import { motion } from 'framer-motion';
import './DroneInventory.css';

const DroneInventory = ({ token }) => {
  const domain = 'http://localhost:5000'; // dev
  const [drones, setDrones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrones();
    const interval = setInterval(fetchDrones, 1000); // 1s sync
    return () => clearInterval(interval);
  }, [token]);

  const fetchDrones = async () => {
    try {
      const res = await axios.get(`${domain}/api/drones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDrones(res.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching drones:', error);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Idle': return 'var(--success)';
      case 'Deploying': return 'var(--warning)';
      case 'Returning': return 'var(--info)';
      default: return 'var(--text-secondary)';
    }
  };

  const getBatteryColor = (level) => {
    if (level > 60) return 'var(--success)';
    if (level > 20) return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div className="drone-inventory-container">
      <div className="inventory-header">
        <h2>Live Fleet Telemetry</h2>
        <p>Real-time status, battery levels, and coordinates of all active drones.</p>
      </div>

      {loading ? (
        <div className="loading-state">Syncing with fleet...</div>
      ) : (
        <div className="drone-grid">
          {drones.map((drone, index) => (
            <motion.div 
              key={drone.id} 
              className="drone-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="drone-card-header">
                <div className="drone-id">
                  <Package size={20} className="drone-icon" />
                  <h3>{drone.id}</h3>
                </div>
                <div 
                  className="drone-status-badge" 
                  style={{ 
                    borderColor: getStatusColor(drone.status),
                    color: getStatusColor(drone.status),
                    backgroundColor: `${getStatusColor(drone.status)}1A`
                  }}
                >
                  <Activity size={14} />
                  {drone.status}
                </div>
              </div>

              <div className="drone-card-body">
                <div className="battery-section">
                  <div className="battery-header">
                    <span className="battery-label" style={{ color: drone.status === 'Idle' && drone.battery < 100 ? 'var(--success)' : 'var(--text-secondary)' }}>
                      {drone.status === 'Idle' && drone.battery < 100 ? (
                        <><BatteryCharging size={16} /> Recharging</>
                      ) : (
                        <><Battery size={16} /> Power Level</>
                      )}
                    </span>
                    <span className="battery-percentage">{Math.round(drone.battery)}%</span>
                  </div>
                  <div className="battery-bar-bg">
                    <div 
                      className="battery-bar-fill" 
                      style={{ 
                        width: `${drone.battery}%`,
                        backgroundColor: getBatteryColor(drone.battery)
                      }}
                    />
                  </div>
                </div>

                <div className="location-section">
                  <div className="location-item">
                    <Crosshair size={16} className="loc-icon" />
                    <span>Lat: {drone.location.lat.toFixed(5)}</span>
                  </div>
                  <div className="location-item">
                    <Navigation size={16} className="loc-icon" />
                    <span>Lng: {drone.location.lng.toFixed(5)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DroneInventory;
