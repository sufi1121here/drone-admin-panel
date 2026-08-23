import { useEffect, useState } from "react"
import axios from "axios"
import { motion } from "framer-motion"
import "./AdminPanel.css"
import { CheckCircle, XCircle, MapPin, RefreshCw, User, Phone, Clock, AlertTriangle, FolderIcon } from "lucide-react"

const AdminPanel = () => {

  // const domain = "http://localhost:5000"     // dev
  const domain = "https://drone-bend-production.up.railway.app" // live

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
    const interval = setInterval(() => {
      fetchData(true)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      if (!isRefresh) setLoading(true)

      const res = await axios.get(`${domain}/api/drone-requests`)
      setRequests(res.data)
    } catch (err) {
      console.error("Error fetching requests:", err)
    } finally {
      setLoading(false)
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500)
      }
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`${domain}/api/drone-requests/${id}`, { status })
      // Update the local state for immediate UI feedback
      setRequests(requests.map((req) => (req._id === id ? { ...req, status } : req)))

      // Fetch fresh data
      setTimeout(() => fetchData(), 300)

    } catch (err) {
      console.error("Error updating status:", err)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="status-badge pending">
            <Clock size={14} /> Pending
          </span>
        )
      case "accepted":
        return (
          <span className="status-badge accepted">
            <CheckCircle size={14} /> Accepted
          </span>
        )
      case "declined":
        return (
          <span className="status-badge declined">
            <XCircle size={14} /> Declined
          </span>
        )
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  const showMap = (req) => {
    // Using the updated map function with actual coordinates
    const url = `https://www.google.com/maps/dir/?api=1&origin=24.808627777561753,67.12094931331968&destination=${req.latitude},${req.longitude}`
    window.open(url, "_blank")
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-container">
        <div className="admin-header">
          <h1>
            <span className="emoji-icon">📋</span>
            Admin Panel – Drone Requests
          </h1>
          <motion.button
            className="refresh-button"
            onClick={() => fetchData(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={refreshing}
          >
            <motion.div
              animate={{ rotate: refreshing ? 360 : 0 }}
              transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: "linear" }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <RefreshCw size={16} />
            </motion.div>
            Refresh
          </motion.button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <h3>No Requests Found</h3>
            <p>There are currently no drone requests in the system.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-header">
              <div className="header-cell">
                <User size={16} /> User Name
              </div>
              <div className="header-cell">
                <Phone size={16} /> User Number
              </div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
              <div className="header-cell">
                <FolderIcon size={16} /> Category
              </div>
              <div className="header-cell">Map</div>
            </div>

            {requests.map((req) => (
              <motion.div
                key={req._id}
                className="table-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                layout
              >
                <div className="table-cell user-name" data-label="User Name">
                  <div className="user-info">
                    <User size={16} className="user-icon" />
                    <span>{req.userName}</span>
                  </div>
                </div>
                <div className="table-cell user-number" data-label="User Number">
                  <div className="user-info">
                    <Phone size={16} className="user-icon" />
                    <span>{req.mobileNumber}</span>
                  </div>
                </div>
                <div className="table-cell" data-label="Status">{getStatusBadge(req.status)}</div>
                <div className="table-cell" data-label="Actions">
                  {req.status === "pending" && (
                    <div className="action-buttons">
                      <motion.button
                        className="accept-btn"
                        onClick={() => updateStatus(req._id, "accepted")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CheckCircle size={16} /> Accept
                      </motion.button>
                      <motion.button
                        className="decline-btn"
                        onClick={() => updateStatus(req._id, "declined")}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <XCircle size={16} /> Decline
                      </motion.button>
                    </div>
                  )}
                </div>
                <div className="table-cell category-cell" data-label="Category">
                  <div className="category-badge">
                    <span>{req.category || "General"}</span>
                  </div>
                </div>
                <div className="table-cell" data-label="Map">
                  <motion.button
                    className={`map-btn ${!req.longitude ? "disabled" : ""}`}
                    onClick={() => req.longitude && showMap(req)}
                    whileHover={{ scale: req.longitude ? 1.05 : 1 }}
                    whileTap={{ scale: req.longitude ? 0.95 : 1 }}
                    disabled={!req.longitude}
                  >
                    <MapPin size={16} /> Show Map
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
