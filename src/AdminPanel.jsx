import { useEffect, useState } from "react"
import axios from "axios"
import { LogOut, Lock, Map } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast, { Toaster } from "react-hot-toast"
import { formatDistanceToNow } from "date-fns"
import "./AdminPanel.css"
import LiveMap from "./components/LiveMap"
import AnalyticsDashboard from "./components/AnalyticsDashboard"
import {
  CheckCircle,
  XCircle,
  MapPin,
  RefreshCw,
  User,
  Phone,
  Clock,
  AlertTriangle,
  FolderIcon,
  Download,
  Search,
  Filter,
  Calendar,
  Activity,
  List,
  Package,
  Shield
} from "lucide-react"

const AdminPanel = () => {
  const domain = "http://localhost:5000" // dev
  // const domain = "https://drone-bend-production.up.railway.app" // live

  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem("adminToken"))
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  
  // Tab State
  const [activeTab, setActiveTab] = useState("dashboard")

  // Clear interval on unmount
  useEffect(() => {
    if (!token) return;
    
    fetchData()
    const interval = setInterval(() => {
      fetchData(true)
    }, 5000)

    return () => clearInterval(interval)
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoggingIn(true)
    try {
      const res = await axios.post(`${domain}/api/admin/login`, { username, password })
      const newToken = res.data.token
      localStorage.setItem("adminToken", newToken)
      setToken(newToken)
      toast.success("Welcome back, Admin!")
    } catch (err) {
      toast.error("Invalid username or password")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    setToken(null)
    toast.success("Logged out successfully")
  }

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      if (!isRefresh) setLoading(true)

      const config = { headers: { Authorization: `Bearer ${token}` } }
      const res = await axios.get(`${domain}/api/drone-requests`, config)
      setRequests(res.data)
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout()
        toast.error("Session expired. Please log in again.")
      } else {
        console.error("Error fetching requests:", err)
        if (!isRefresh) toast.error("Failed to load requests.")
      }
    } finally {
      setLoading(false)
      if (isRefresh) {
        setTimeout(() => setRefreshing(false), 500)
      }
    }
  }

  const updateStatus = async (id, status) => {
    const confirmMessage = status === 'accepted' 
      ? 'Are you sure you want to ACCEPT this request?'
      : 'Are you sure you want to DECLINE this request?';
      
    if (!window.confirm(confirmMessage)) return;

    const loadingToast = toast.loading(`Updating status to ${status}...`);

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } }
      await axios.put(`${domain}/api/drone-requests/${id}`, { status }, config)
      // Update the local state for immediate UI feedback
      setRequests(requests.map((req) => (req._id === id ? { ...req, status } : req)))
      toast.success(`Request ${status} successfully!`, { id: loadingToast })
      // Fetch fresh data
      setTimeout(() => fetchData(), 300)
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout()
      } else {
        console.error("Error updating status:", err)
        toast.error("Failed to update status", { id: loadingToast })
      }
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
    const url = `https://www.google.com/maps/dir/?api=1&origin=24.808627777561753,67.12094931331968&destination=${req.latitude},${req.longitude}`
    window.open(url, "_blank")
  }

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.mobileNumber?.includes(searchQuery)
    const matchesStatus = statusFilter === "all" || req.status === statusFilter
    const reqCat = req.category || "General"
    const matchesCategory = categoryFilter === "all" || reqCat === categoryFilter

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Generate Unique Categories for Filter
  const categories = ["all", ...new Set(requests.map((r) => r.category || "General"))]

  const exportToCSV = () => {
    const headers = ["User Name", "Mobile Number", "Category", "Status", "Requested At", "Location (Lat,Lng)"]
    const rows = filteredRequests.map((req) => {
      const dateStr = req.createdAt ? new Date(req.createdAt).toLocaleString() : "N/A"
      return [
        `"${req.userName || ""}"`,
        `"${req.mobileNumber || ""}"`,
        `"${req.category || "General"}"`,
        `"${req.status || ""}"`,
        `"${dateStr}"`,
        `"${req.latitude},${req.longitude}"`,
      ]
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `drone_requests_${new Date().getTime()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Exported successfully!")
  }

  if (!token) {
    return (
      <div className="admin-wrapper login-wrapper">
        <Toaster position="top-right" toastOptions={{
          style: { background: 'rgba(30, 41, 59, 0.9)', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }
        }} />
        <motion.div 
          className="login-box"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="login-header">
            <div className="login-icon-container">
              <Lock size={32} color="#8b5cf6" />
            </div>
            <h2>Admin Login</h2>
            <p>Access the Drone Command Center</p>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <motion.button 
              type="submit" 
              className="login-submit-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Authenticating..." : "Login to Command Center"}
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="admin-wrapper">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'rgba(30, 41, 59, 0.9)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)'
        }
      }} />
      
      <div className="admin-container">
        {/* Header section */}
        <div className="admin-header">
          <h1>
            <span className="emoji-icon">📋</span>
            Drone Command Center
          </h1>

          <div className="header-actions">
            <motion.button
              className="export-button"
              onClick={exportToCSV}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Download size={16} /> Export CSV
            </motion.button>
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
            <motion.button
              className="logout-button"
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut size={16} /> Logout
            </motion.button>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <List size={18} /> Dashboard
          </button>
          <button className={`tab-btn ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <Map size={18} /> Live Map
          </button>
          <button className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <Activity size={18} /> Analytics
          </button>
          <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package size={18} /> Drone Inventory
          </button>
          <button className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <Shield size={18} /> Admin Management
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            {/* Filters and Search */}
        <div className="controls-section">
          <div className="search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filters">
            <div className="filter-group">
              <Activity size={16} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div className="filter-group">
              <Filter size={16} />
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={48} />
            <h3>No Requests Found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="table-header">
              <div className="header-cell">
                <User size={16} /> User Details
              </div>
              <div className="header-cell">
                <FolderIcon size={16} /> Category
              </div>
              <div className="header-cell">
                <Calendar size={16} /> Time
              </div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
              <div className="header-cell">Map</div>
            </div>

            <AnimatePresence>
              {filteredRequests.map((req) => (
                <motion.div
                  key={req._id}
                  className="table-row"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <div className="table-cell user-name" data-label="User Details">
                    <div className="user-info">
                      <User size={16} className="user-icon" />
                      <div className="user-text-info">
                        <span className="name">{req.userName}</span>
                        <span className="phone">{req.mobileNumber}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="table-cell category-cell" data-label="Category">
                    <div className="category-badge">
                      <span>{req.category || "General"}</span>
                    </div>
                  </div>

                  <div className="table-cell time-cell" data-label="Time">
                    {req.createdAt ? (
                      <span className="time-text">
                        {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                      </span>
                    ) : (
                      <span className="time-text">N/A</span>
                    )}
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
                  <div className="table-cell" data-label="Map">
                    <motion.button
                      className={`map-btn ${!req.longitude ? "disabled" : ""}`}
                      onClick={() => req.longitude && showMap(req)}
                      whileHover={{ scale: req.longitude ? 1.05 : 1 }}
                      whileTap={{ scale: req.longitude ? 0.95 : 1 }}
                      disabled={!req.longitude}
                    >
                      <MapPin size={16} /> Map
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
          </>
        )}

        {activeTab === 'map' && <LiveMap token={token} />}
        
        {activeTab === 'analytics' && <AnalyticsDashboard requests={requests} />}
        
        {activeTab === 'inventory' && (
          <div className="empty-state">
            <Package size={48} />
            <h3>Drone Inventory Status</h3>
            <p>Coming soon: Track real-time battery levels, maintenance schedules, and drone availability.</p>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="empty-state">
            <Shield size={48} />
            <h3>Admin Management</h3>
            <p>Coming soon: Manage user roles, permissions, and system settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel
