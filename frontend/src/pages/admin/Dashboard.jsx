import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Spin, Alert, Button, Statistic, Timeline } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined, 
  TeamOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { initSocket, joinAdminDashboard, subscribeToDashboardUpdates } from '../../utils/socket';
import api from '../../utils/api';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Initialize dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/dashboard/realtime');
        setDashboardData(response.data.data);
        setLastUpdated(new Date());
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Initialize Socket.IO for real-time updates
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Initialize socket connection
    initSocket(token);
    
    // Join admin dashboard room
    joinAdminDashboard();
    
    // Subscribe to dashboard updates
    const unsubscribe = subscribeToDashboardUpdates((data) => {
      console.log('Received real-time dashboard update', data);
      setDashboardData(data);
      setLastUpdated(new Date());
    });
    
    // Cleanup on component unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard/realtime');
      setDashboardData(response.data.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to refresh dashboard data');
      setLoading(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="dashboard-loading">
        <Spin size="large" />
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <Alert
        message="Error"
        description={`Failed to load dashboard data: ${error}`}
        type="error"
        showIcon
      />
    );
  }

  const { users, orders, revenue, products, activities } = dashboardData || {};

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="dashboard-actions">
          <span className="last-updated">
            Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
          </span>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh} 
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* User Statistics */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={users?.total || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={users?.customers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Total Sellers"
              value={users?.sellers || 0}
              prefix={<ShopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="New Users Today"
              value={users?.newToday || 0}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Order and Revenue Statistics */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Today's Orders"
              value={orders?.todayCount || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={orders?.pending || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="Today's Revenue"
              value={revenue?.today || 0}
              precision={2}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row gutter={16} className="content-row">
        <Col xs={24} lg={12}>
          <Card title="Recent Orders">
            <Table
              dataSource={orders?.recent || []}
              rowKey="_id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Order ID',
                  dataIndex: 'orderNumber',
                  key: 'orderNumber',
                },
                {
                  title: 'Amount',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  render: (amount) => `$${amount.toFixed(2)}`,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                },
                {
                  title: 'Date',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  render: (date) => new Date(date).toLocaleDateString(),
                },
              ]}
            />
          </Card>
        </Col>
        
        {/* Top Selling Products */}
        <Col xs={24} lg={12}>
          <Card title="Top Selling Products Today">
            <Table
              dataSource={products?.topSelling || []}
              rowKey="_id"
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Product Name',
                  dataIndex: 'productName',
                  key: 'productName',
                },
                {
                  title: 'Quantity Sold',
                  dataIndex: 'totalQuantity',
                  key: 'totalQuantity',
                },
                {
                  title: 'Revenue',
                  dataIndex: 'totalRevenue',
                  key: 'totalRevenue',
                  render: (revenue) => `$${revenue.toFixed(2)}`,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Recent Customer Activity */}
      <Row gutter={16} className="content-row">
        <Col xs={24}>
          <Card title="Recent Customer Activity">
            <Timeline>
              {activities?.recentCustomer?.map((activity, index) => (
                <Timeline.Item key={index}>
                  <p>
                    <strong>{activity.name}</strong> ({activity.email})
                  </p>
                  <p>{activity.activity}</p>
                  <p>{new Date(activity.lastActive).toLocaleString()}</p>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 