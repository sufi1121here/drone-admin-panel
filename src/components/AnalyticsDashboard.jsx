import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Clock, CheckCircle, XCircle, List } from 'lucide-react';
import './AnalyticsDashboard.css';

const COLORS = ['#8b5cf6', '#ef4444', '#f97316', '#eab308', '#3b82f6', '#10b981'];

const AnalyticsDashboard = ({ requests }) => {
  // 1. Compute Metric Cards
  const totalRequests = requests.length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const acceptedRequests = requests.filter((r) => r.status === "accepted").length;
  const declinedRequests = requests.filter((r) => r.status === "declined").length;

  // 2. Compute Category Data for Pie Chart
  const categoryCount = {};
  requests.forEach(req => {
    const cat = req.category || "General";
    // Clean up category string (remove emojis for cleaner labels if desired, or keep them)
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  const pieData = Object.keys(categoryCount).map(key => ({
    name: key,
    value: categoryCount[key]
  })).sort((a, b) => b.value - a.value);

  // 3. Compute Status Data for Bar Chart
  const barData = [
    { name: 'Pending', count: pendingRequests, fill: '#f59e0b' },
    { name: 'Accepted', count: acceptedRequests, fill: '#10b981' },
    { name: 'Declined', count: declinedRequests, fill: '#ef4444' },
  ];

  // Custom Tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${payload[0].name || label} : ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="analytics-container">
      
      {/* Top row: Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card total">
          <div className="metric-icon"><List size={24} /></div>
          <div className="metric-info">
            <h3>Total Requests</h3>
            <p>{totalRequests}</p>
          </div>
        </div>
        <div className="metric-card pending">
          <div className="metric-icon"><Clock size={24} /></div>
          <div className="metric-info">
            <h3>Pending</h3>
            <p>{pendingRequests}</p>
          </div>
        </div>
        <div className="metric-card accepted">
          <div className="metric-icon"><CheckCircle size={24} /></div>
          <div className="metric-info">
            <h3>Accepted</h3>
            <p>{acceptedRequests}</p>
          </div>
        </div>
        <div className="metric-card declined">
          <div className="metric-icon"><XCircle size={24} /></div>
          <div className="metric-info">
            <h3>Declined</h3>
            <p>{declinedRequests}</p>
          </div>
        </div>
      </div>

      {/* Bottom row: Charts */}
      <div className="charts-grid">
        
        {/* Pie Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Emergency Categories</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="chart-card">
          <h3 className="chart-title">Request Status Distribution</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#8E8E93" tick={{fill: '#8E8E93'}} />
                <YAxis stroke="#8E8E93" tick={{fill: '#8E8E93'}} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
