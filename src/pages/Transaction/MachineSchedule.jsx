import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Button, Modal, Form, Badge, InputGroup, OverlayTrigger, Tooltip } from "react-bootstrap";
import { API_BASE } from "../../config";
import * as signalR from "@microsoft/signalr";
import "./MachineSchedule.css";

export default function Schedules() {
  // State Management
  const [machines, setMachines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [config, setConfig] = useState({
    startTime: "09:00",
    endTime: "17:00",
    slotDuration: 30, // in minutes
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"]
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterMachine, setFilterMachine] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);

  const connectionRef = useRef(null);

  // Time slot generation
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      currentTime += config.slotDuration;
    }

    return slots;
  };

  // Load initial data
  useEffect(() => {
    loadMachines();
    loadTasks();
    setupSignalR();

    return () => {
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, []);

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

  const loadTasks = async () => {
    // Mock data for now - would connect to actual API
    const mockTasks = [
      {
        id: 1,
        machineId: 1,
        title: "Maintenance",
        startTime: "09:00",
        endTime: "10:00",
        date: selectedDate,
        color: "#dc3545",
        status: "scheduled",
        recurring: false,
        description: "Regular maintenance check"
      },
      {
        id: 2,
        machineId: 2,
        title: "Production Run",
        startTime: "10:30",
        endTime: "12:00",
        date: selectedDate,
        color: "#28a745",
        status: "in-progress",
        recurring: false,
        description: "Manufacturing batch #2453"
      }
    ];
    setTasks(mockTasks);
  };

  const setupSignalR = () => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE}updatesHub`)
      .withAutomaticReconnect()
      .build();

    connection.on("ScheduleUpdate", () => {
      loadTasks();
    });

    connection.start().catch(err => console.error("SignalR connection error:", err));
    connectionRef.current = connection;
  };

  // Task Management
  const handleTaskSubmit = (taskData) => {
    if (editingTask) {
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
    } else {
      const newTask = {
        ...taskData,
        id: Date.now(),
        date: selectedDate,
        status: "scheduled"
      };
      setTasks(prev => [...prev, newTask]);
    }
    setShowTaskModal(false);
    setEditingTask(null);
  };

  const handleTaskDelete = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  // Drag and Drop
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, machineId, timeSlot) => {
    e.preventDefault();
    if (draggedTask) {
      const updatedTask = {
        ...draggedTask,
        machineId,
        startTime: timeSlot
      };
      setTasks(prev => prev.map(t => t.id === draggedTask.id ? updatedTask : t));
      setDraggedTask(null);
    }
  };

  // Filtering
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (filterMachine && task.machineId !== parseInt(filterMachine)) return false;
      if (filterStatus !== "all" && task.status !== filterStatus) return false;
      if (task.date !== selectedDate) return false;
      return true;
    });
  };

  const timeSlots = generateTimeSlots();
  const filteredTasks = getFilteredTasks();

  return (
    <Container fluid>
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <h2 className="mb-3">Machine Task Scheduler</h2>
        </Col>
      </Row>

      {/* Controls */}
      <Row className="mb-4">
        <Col md={8}>
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <InputGroup style={{ width: "200px" }}>
              <InputGroup.Text>📅</InputGroup.Text>
              <Form.Control
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              style={{ width: "200px" }}
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
            >
              <option value="">All Machines</option>
              {machines.map(m => (
                <option key={m.MachineID} value={m.MachineID}>
                  {m.MachineName}
                </option>
              ))}
            </Form.Select>

            <Form.Select
              style={{ width: "150px" }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </Form.Select>

            <Button variant="primary" onClick={() => setShowTaskModal(true)}>
              Add Task
            </Button>

            <Button variant="secondary" onClick={() => setShowConfigModal(true)}>
              Settings
            </Button>
          </div>
        </Col>

        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <div className="d-flex justify-content-around">
                <div>
                  <strong>{filteredTasks.length}</strong>
                  <br />
                  <small className="text-muted">Total Tasks</small>
                </div>
                <div>
                  <strong>{machines.length}</strong>
                  <br />
                  <small className="text-muted">Active Machines</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Timeline View */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Timeline View - {new Date(selectedDate).toLocaleDateString()}</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="timeline-container">
            <div className="timeline-grid">
              {/* Time Header */}
              <div className="timeline-header">
                <div className="machine-label">Machines</div>
                {timeSlots.map(slot => (
                  <div key={slot} className="time-slot-header">
                    {slot}
                  </div>
                ))}
              </div>

              {/* Machine Rows */}
              {machines.map(machine => (
                <div key={machine.MachineID} className="machine-row">
                  <div className="machine-name">
                    <strong>{machine.MachineName}</strong>
                    <br />
                    <small className="text-muted">{machine.MachineCode}</small>
                  </div>

                  {timeSlots.map(slot => {
                    const task = filteredTasks.find(
                      t => t.machineId === machine.MachineID && t.startTime === slot
                    );

                    return (
                      <div
                        key={`${machine.MachineID}-${slot}`}
                        className={`time-slot ${task ? 'has-task' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, machine.MachineID, slot)}
                      >
                        {task && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                <strong>{task.title}</strong><br />
                                {task.startTime} - {task.endTime}<br />
                                {task.description}
                              </Tooltip>
                            }
                          >
                            <div
                              className="task-block"
                              style={{ backgroundColor: task.color }}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task)}
                              onClick={() => {
                                setEditingTask(task);
                                setShowTaskModal(true);
                              }}
                            >
                              <div className="task-title">{task.title}</div>
                              <Badge bg={task.status === 'in-progress' ? 'warning' : task.status === 'completed' ? 'success' : 'secondary'}>
                                {task.status}
                              </Badge>
                            </div>
                          </OverlayTrigger>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Task Summary */}
      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Task Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="task-list">
                {filteredTasks.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No tasks scheduled for this date
                  </div>
                ) : (
                  filteredTasks.map(task => {
                    const machine = machines.find(m => m.MachineID === task.machineId);
                    return (
                      <div key={task.id} className="task-item d-flex justify-content-between align-items-center p-3 border-bottom">
                        <div>
                          <Badge style={{ backgroundColor: task.color }} className="me-2">
                            {task.title}
                          </Badge>
                          <span className="fw-semibold">{machine?.MachineName}</span>
                          <span className="ms-3 text-muted">
                            {task.startTime} - {task.endTime}
                          </span>
                          {task.description && (
                            <div className="mt-1">
                              <small className="text-muted">{task.description}</small>
                            </div>
                          )}
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="me-2"
                            onClick={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleTaskDelete(task.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Task Modal */}
      <TaskModal
        show={showTaskModal}
        onHide={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskSubmit}
        task={editingTask}
        machines={machines}
        timeSlots={timeSlots}
      />

      {/* Config Modal */}
      <ConfigModal
        show={showConfigModal}
        onHide={() => setShowConfigModal(false)}
        config={config}
        onSave={setConfig}
      />
    </Container>
  );
}

// Task Modal Component
function TaskModal({ show, onHide, onSubmit, task, machines, timeSlots }) {
  const [formData, setFormData] = useState({
    title: "",
    machineId: "",
    startTime: "",
    endTime: "",
    color: "#007bff",
    description: "",
    recurring: false,
    recurringType: "daily"
  });

  useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: "",
        machineId: machines[0]?.MachineID || "",
        startTime: timeSlots[0] || "",
        endTime: timeSlots[1] || "",
        color: "#007bff",
        description: "",
        recurring: false,
        recurringType: "daily"
      });
    }
  }, [task, machines, timeSlots]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{task ? "Edit Task" : "Add New Task"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Task Title</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Machine</Form.Label>
                <Form.Select
                  value={formData.machineId}
                  onChange={(e) => setFormData({...formData, machineId: parseInt(e.target.value)})}
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map(m => (
                    <option key={m.MachineID} value={m.MachineID}>
                      {m.MachineName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Select
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                  required
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Select
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                  required
                >
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Color</Form.Label>
                <Form.Control
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Check
                type="checkbox"
                label="Recurring Task"
                checked={formData.recurring}
                onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
              />
            </Col>
            {formData.recurring && (
              <Col md={6}>
                <Form.Select
                  value={formData.recurringType}
                  onChange={(e) => setFormData({...formData, recurringType: e.target.value})}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </Form.Select>
              </Col>
            )}
          </Row>

          <div className="mt-3 d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {task ? "Update" : "Create"} Task
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

// Config Modal Component
function ConfigModal({ show, onHide, config, onSave }) {
  const [formData, setFormData] = useState(config);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Scheduler Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Start Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>End Time</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Slot Duration (minutes)</Form.Label>
            <Form.Select
              value={formData.slotDuration}
              onChange={(e) => setFormData({...formData, slotDuration: parseInt(e.target.value)})}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Working Days</Form.Label>
            <div className="d-flex gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                <Form.Check
                  key={day}
                  type="checkbox"
                  label={day}
                  checked={formData.workingDays.includes(day)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        workingDays: [...formData.workingDays, day]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        workingDays: formData.workingDays.filter(d => d !== day)
                      });
                    }
                  }}
                />
              ))}
            </div>
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Configuration
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
