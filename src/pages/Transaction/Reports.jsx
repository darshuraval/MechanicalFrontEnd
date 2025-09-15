import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Form, Badge, Table, Dropdown, Modal, Alert } from "react-bootstrap";
import { API_BASE } from "../../config";
import "./Reports.css";

export default function Reports() {
  // State Management
  const [reportData, setReportData] = useState({
    summary: {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      avgUtilization: 0,
      avgTaskDuration: 0
    },
    machines: [],
    timelineData: [],
    taskCategories: [],
    trends: {}
  });

  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    dateTo: new Date().toISOString().split('T')[0],
    machineId: "",
    taskType: "",
    viewType: "summary" // summary, machine-details, timeline
  });

  const [machines, setMachines] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState([]);

  // Load initial data
  useEffect(() => {
    loadMachines();
    loadReportData();
  }, [filters.dateFrom, filters.dateTo, filters.machineId, filters.taskType]);

  const loadMachines = async () => {
    try {
      const res = await fetch(`${API_BASE}api/Machine/GetForListing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      const machineList = data?.items?.lstResult1 || [];
      setMachines(machineList.filter(m => m.IsActive));
    } catch (err) {
      console.error("Error loading machines:", err);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would be API calls
      const mockData = generateMockReportData();
      setReportData(mockData);
      generateInsights(mockData);
    } catch (err) {
      console.error("Error loading report data:", err);
    }
    setLoading(false);
  };

  const generateMockReportData = () => {
    const totalTasks = 156;
    const completedTasks = 98;
    const pendingTasks = 42;
    const inProgressTasks = 16;

    // Machine data
    const machineData = machines.map((machine) => {
      const tasksScheduled = Math.floor(Math.random() * 30) + 10;
      const tasksCompleted = Math.floor(tasksScheduled * (0.6 + Math.random() * 0.3));
      const utilization = Math.floor(Math.random() * 40) + 50;

      return {
        id: machine.MachineID,
        name: machine.MachineName,
        code: machine.MachineCode,
        tasksScheduled,
        tasksCompleted,
        tasksPending: tasksScheduled - tasksCompleted,
        utilization,
        avgTaskDuration: Math.floor(Math.random() * 60) + 30,
        status: utilization > 80 ? "high" : utilization > 60 ? "medium" : "low"
      };
    });

    // Timeline data (hourly for 8-hour window)
    const timelineData = [];
    for (let hour = 9; hour <= 17; hour++) {
      timelineData.push({
        time: `${hour}:00`,
        scheduled: Math.floor(Math.random() * 15) + 5,
        completed: Math.floor(Math.random() * 12) + 3,
        inProgress: Math.floor(Math.random() * 5) + 1
      });
    }

    // Task categories
    const taskCategories = [
      { name: "Maintenance", value: 35, color: "#dc3545" },
      { name: "Production", value: 45, color: "#28a745" },
      { name: "Testing", value: 15, color: "#ffc107" },
      { name: "Setup", value: 5, color: "#007bff" }
    ];

    return {
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        avgUtilization: Math.round(machineData.reduce((acc, m) => acc + m.utilization, 0) / machineData.length),
        avgTaskDuration: Math.round(machineData.reduce((acc, m) => acc + m.avgTaskDuration, 0) / machineData.length)
      },
      machines: machineData,
      timelineData,
      taskCategories,
      trends: {
        tasksChange: "+12%",
        utilizationChange: "-3%",
        efficiencyChange: "+8%"
      }
    };
  };

  const generateInsights = (data) => {
    const insights = [];

    // Low utilization machines
    const lowUtilMachines = data.machines.filter(m => m.utilization < 50);
    if (lowUtilMachines.length > 0) {
      insights.push({
        type: "warning",
        title: "Low Utilization Alert",
        message: `${lowUtilMachines.length} machine(s) are underutilized (<50%): ${lowUtilMachines.map(m => m.name).join(", ")}`
      });
    }

    // High performing machines
    const highPerformMachines = data.machines.filter(m => m.utilization > 85);
    if (highPerformMachines.length > 0) {
      insights.push({
        type: "success",
        title: "High Performance",
        message: `${highPerformMachines.length} machine(s) showing excellent utilization (>85%)`
      });
    }

    // Task completion rate
    const completionRate = (data.summary.completedTasks / data.summary.totalTasks) * 100;
    if (completionRate < 70) {
      insights.push({
        type: "danger",
        title: "Low Completion Rate",
        message: `Task completion rate is ${completionRate.toFixed(1)}%. Consider reviewing task scheduling.`
      });
    }

    setInsights(insights);
  };

  const handleExport = async () => {
    setLoading(true);

    if (exportType === "csv") {
      exportToCSV();
    } else {
      exportToPDF();
    }

    setShowExportModal(false);
    setLoading(false);
  };

  const exportToCSV = () => {
    const csvData = [
      ["Machine", "Tasks Scheduled", "Tasks Completed", "Tasks Pending", "Utilization %", "Avg Duration (min)"],
      ...reportData.machines.map(m => [
        m.name,
        m.tasksScheduled,
        m.tasksCompleted,
        m.tasksPending,
        m.utilization,
        m.avgTaskDuration
      ])
    ];

    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `machine-report-${filters.dateFrom}-to-${filters.dateTo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Simple PDF export simulation
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Machine Task Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f8f9fa; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin: 20px 0; }
            .kpi { text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Machine Task Report</h1>
            <p>Period: ${filters.dateFrom} to ${filters.dateTo}</p>
          </div>

          <div class="summary">
            <div class="kpi">
              <h3>${reportData.summary.totalTasks}</h3>
              <p>Total Tasks</p>
            </div>
            <div class="kpi">
              <h3>${reportData.summary.completedTasks}</h3>
              <p>Completed</p>
            </div>
            <div class="kpi">
              <h3>${reportData.summary.avgUtilization}%</h3>
              <p>Avg Utilization</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Machine</th>
                <th>Tasks Scheduled</th>
                <th>Tasks Completed</th>
                <th>Utilization %</th>
                <th>Avg Duration (min)</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.machines.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.tasksScheduled}</td>
                  <td>${m.tasksCompleted}</td>
                  <td>${m.utilization}%</td>
                  <td>${m.avgTaskDuration}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const getUtilizationColor = (utilization) => {
    if (utilization >= 80) return "success";
    if (utilization >= 60) return "warning";
    return "danger";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "high": return "🟢";
      case "medium": return "🟡";
      case "low": return "🔴";
      default: return "⚪";
    }
  };

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Machine Task Reports</h2>
        </Col>
      </Row>

      {/* Filters */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row className="align-items-end">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>From Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>To Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Machine</Form.Label>
                    <Form.Select
                      value={filters.machineId}
                      onChange={(e) => setFilters({...filters, machineId: e.target.value})}
                    >
                      <option value="">All Machines</option>
                      {machines.map(m => (
                        <option key={m.MachineID} value={m.MachineID}>
                          {m.MachineName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Task Type</Form.Label>
                    <Form.Select
                      value={filters.taskType}
                      onChange={(e) => setFilters({...filters, taskType: e.target.value})}
                    >
                      <option value="">All Types</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="production">Production</option>
                      <option value="testing">Testing</option>
                      <option value="setup">Setup</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button variant="primary" onClick={() => setShowExportModal(true)}>
                    Export Report
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* View Toggle */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex gap-2">
            <Button
              variant={filters.viewType === "summary" ? "primary" : "outline-primary"}
              onClick={() => setFilters({...filters, viewType: "summary"})}
            >
              📊 Summary
            </Button>
            <Button
              variant={filters.viewType === "machine-details" ? "primary" : "outline-primary"}
              onClick={() => setFilters({...filters, viewType: "machine-details"})}
            >
              🏭 Machine Details
            </Button>
            <Button
              variant={filters.viewType === "timeline" ? "primary" : "outline-primary"}
              onClick={() => setFilters({...filters, viewType: "timeline"})}
            >
              📈 Timeline
            </Button>
          </div>
        </Col>
      </Row>

      {/* Insights */}
      {insights.length > 0 && (
        <Row className="mb-4">
          <Col>
            {insights.map((insight, index) => (
              <Alert key={index} variant={insight.type} className="mb-2">
                <Alert.Heading className="h6">{insight.title}</Alert.Heading>
                {insight.message}
              </Alert>
            ))}
          </Col>
        </Row>
      )}

      {/* Summary View */}
      {filters.viewType === "summary" && (
        <>
          {/* KPI Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="kpi-card text-center">
                <Card.Body>
                  <div className="kpi-value text-primary">{reportData.summary.totalTasks}</div>
                  <div className="kpi-label">Total Tasks</div>
                  <small className="text-muted">
                    Trend: <span className="text-success">{reportData.trends.tasksChange}</span>
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="kpi-card text-center">
                <Card.Body>
                  <div className="kpi-value text-success">{reportData.summary.completedTasks}</div>
                  <div className="kpi-label">Completed</div>
                  <small className="text-muted">
                    {reportData.summary.pendingTasks} pending, {reportData.summary.inProgressTasks} in progress
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="kpi-card text-center">
                <Card.Body>
                  <div className="kpi-value text-warning">{reportData.summary.avgUtilization}%</div>
                  <div className="kpi-label">Avg Utilization</div>
                  <small className="text-muted">
                    Trend: <span className="text-danger">{reportData.trends.utilizationChange}</span>
                  </small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="kpi-card text-center">
                <Card.Body>
                  <div className="kpi-value text-info">{reportData.summary.avgTaskDuration}</div>
                  <div className="kpi-label">Avg Duration (min)</div>
                  <small className="text-muted">
                    Efficiency: <span className="text-success">{reportData.trends.efficiencyChange}</span>
                  </small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts Row */}
          <Row className="mb-4">
            <Col md={8}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Hourly Task Distribution</h5>
                </Card.Header>
                <Card.Body>
                  <TimelineChart data={reportData.timelineData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Task Categories</h5>
                </Card.Header>
                <Card.Body>
                  <PieChart data={reportData.taskCategories} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* Machine Details View */}
      {filters.viewType === "machine-details" && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Machine Performance Details</h5>
              </Card.Header>
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Machine</th>
                      <th>Code</th>
                      <th>Tasks Scheduled</th>
                      <th>Tasks Completed</th>
                      <th>Tasks Pending</th>
                      <th>Utilization</th>
                      <th>Avg Duration</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.machines.map(machine => (
                      <tr key={machine.id}>
                        <td>{getStatusIcon(machine.status)}</td>
                        <td><strong>{machine.name}</strong></td>
                        <td><small className="text-muted">{machine.code}</small></td>
                        <td>{machine.tasksScheduled}</td>
                        <td>{machine.tasksCompleted}</td>
                        <td>{machine.tasksPending}</td>
                        <td>
                          <Badge bg={getUtilizationColor(machine.utilization)}>
                            {machine.utilization}%
                          </Badge>
                        </td>
                        <td>{machine.avgTaskDuration} min</td>
                        <td>
                          <div className="performance-bar">
                            <div
                              className="performance-fill"
                              style={{
                                width: `${machine.utilization}%`,
                                backgroundColor: machine.utilization >= 80 ? '#28a745' :
                                                machine.utilization >= 60 ? '#ffc107' : '#dc3545'
                              }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Timeline View */}
      {filters.viewType === "timeline" && (
        <Row>
          <Col>
            <Card>
              <Card.Header>
                <h5 className="mb-0">Task Timeline Analysis</h5>
              </Card.Header>
              <Card.Body>
                <TimelineChart data={reportData.timelineData} detailed={true} />

                <hr />

                <Row className="mt-4">
                  <Col md={6}>
                    <h6>Peak Hours Analysis</h6>
                    <Table size="sm">
                      <tbody>
                        <tr>
                          <td>Busiest Hour:</td>
                          <td><strong>11:00 AM</strong></td>
                        </tr>
                        <tr>
                          <td>Quietest Hour:</td>
                          <td><strong>16:00 PM</strong></td>
                        </tr>
                        <tr>
                          <td>Average Load:</td>
                          <td><strong>8.2 tasks/hour</strong></td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                  <Col md={6}>
                    <h6>Recommendations</h6>
                    <ul className="list-unstyled">
                      <li>• Consider redistributing tasks from 11:00-13:00</li>
                      <li>• Utilize afternoon slots for maintenance</li>
                      <li>• Schedule critical tasks during peak hours</li>
                    </ul>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Export Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Export Format</Form.Label>
            <Form.Select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
            >
              <option value="pdf">PDF Document</option>
              <option value="csv">CSV Spreadsheet</option>
            </Form.Select>
          </Form.Group>
          <p className="text-muted">
            {exportType === "pdf"
              ? "Export a formatted PDF report suitable for printing and sharing."
              : "Export raw data in CSV format for further analysis in spreadsheet applications."
            }
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleExport} disabled={loading}>
            {loading ? "Exporting..." : "Export Report"}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

// Timeline Chart Component
function TimelineChart({ data, detailed = false }) {
  const maxValue = Math.max(...data.map(d => d.scheduled));

  return (
    <div className="timeline-chart">
      <div className="chart-container">
        {data.map((item, index) => (
          <div key={index} className="chart-item">
            <div className="chart-bars">
              <div
                className="bar scheduled"
                style={{ height: `${(item.scheduled / maxValue) * 100}%` }}
                title={`Scheduled: ${item.scheduled}`}
              ></div>
              <div
                className="bar completed"
                style={{ height: `${(item.completed / maxValue) * 100}%` }}
                title={`Completed: ${item.completed}`}
              ></div>
              {detailed && (
                <div
                  className="bar in-progress"
                  style={{ height: `${(item.inProgress / maxValue) * 100}%` }}
                  title={`In Progress: ${item.inProgress}`}
                ></div>
              )}
            </div>
            <div className="chart-label">{item.time}</div>
          </div>
        ))}
      </div>

      <div className="chart-legend mt-3">
        <div className="legend-item">
          <span className="legend-color scheduled"></span>
          Scheduled
        </div>
        <div className="legend-item">
          <span className="legend-color completed"></span>
          Completed
        </div>
        {detailed && (
          <div className="legend-item">
            <span className="legend-color in-progress"></span>
            In Progress
          </div>
        )}
      </div>
    </div>
  );
}

// Pie Chart Component
function PieChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="pie-chart-container">
      <div className="pie-chart">
        <svg viewBox="0 0 200 200" className="pie-svg">
          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360;

            const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
            const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
            const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
            const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

            const largeArcFlag = percentage > 50 ? 1 : 0;

            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            cumulativePercentage += percentage;

            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      <div className="pie-legend">
        {data.map((item, index) => (
          <div key={index} className="pie-legend-item">
            <span
              className="pie-legend-color"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="pie-legend-label">{item.name}</span>
            <span className="pie-legend-value">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
