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
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    machineConfigs: {} // Individual machine configurations
  });

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filterMachine, setFilterMachine] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [draggedTask, setDraggedTask] = useState(null);

  const connectionRef = useRef(null);

  // Time slot generation for specific machine
  const generateTimeSlotsForMachine = (machineId) => {
    const machineConfig = config.machineConfigs[machineId] || { slotDuration: 30 };
    const slots = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      currentTime += machineConfig.slotDuration;
    }

    return slots;
  };

  // Generate unified timeline for header (smallest slot duration)
  const generateUnifiedTimeSlots = () => {
    const minSlotDuration = Math.min(
      ...machines.map(m => config.machineConfigs[m.MachineID]?.slotDuration || 30)
    );

    const slots = [];
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    let currentTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    while (currentTime < endTime) {
      const hour = Math.floor(currentTime / 60);
      const min = currentTime % 60;
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
      currentTime += minSlotDuration;
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
      const activeMachines = machineList.filter(m => m.IsActive);
      setMachines(activeMachines);

      // Initialize machine configs if not exists
      setConfig(prevConfig => {
        const newMachineConfigs = { ...prevConfig.machineConfigs };
        activeMachines.forEach(machine => {
          if (!newMachineConfigs[machine.MachineID]) {
            // Default configurations based on machine type
            const defaultSlot = machine.MachineName.toLowerCase().includes('lathe') ? 60 :
                              machine.MachineName.toLowerCase().includes('cnc') ? 15 : 30;
            newMachineConfigs[machine.MachineID] = {
              slotDuration: defaultSlot,
              color: getRandomColor()
            };
          }
        });
        return {
          ...prevConfig,
          machineConfigs: newMachineConfigs
        };
      });
    } catch (err) {
      console.error("Error loading machines:", err);
    }
  };

  const getRandomColor = () => {
    const colors = ['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec'];
    return colors[Math.floor(Math.random() * colors.length)];
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
        recurringType: "none",
        description: "Regular maintenance check",
        duration: 60,
        priority: "high"
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
        recurringType: "none",
        description: "Manufacturing batch #2453",
        duration: 90,
        priority: "medium"
      },
      {
        id: 3,
        machineId: 1,
        title: "Quality Check",
        startTime: "14:00",
        endTime: "15:00",
        date: selectedDate,
        color: "#ffc107",
        status: "scheduled",
        recurring: true,
        recurringType: "daily",
        description: "Daily quality inspection",
        duration: 60,
        priority: "high"
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

  // Conflict Detection
  const checkConflicts = (newTask, excludeTaskId = null) => {
    const conflicts = [];
    const newStartTime = timeToMinutes(newTask.startTime);
    const newEndTime = timeToMinutes(newTask.endTime);

    tasks.forEach(task => {
      if (task.id === excludeTaskId || task.machineId !== newTask.machineId || task.date !== newTask.date) return;

      const taskStartTime = timeToMinutes(task.startTime);
      const taskEndTime = timeToMinutes(task.endTime);

      // Check for overlap
      if (newStartTime < taskEndTime && newEndTime > taskStartTime) {
        conflicts.push(task);
      }
    });

    return conflicts;
  };

  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Task Management
  const handleTaskSubmit = (taskData) => {
    // Check for conflicts
    const conflicts = checkConflicts(taskData, editingTask?.id);

    if (conflicts.length > 0 && !window.confirm(
      `This task conflicts with ${conflicts.length} existing task(s). Continue anyway?`
    )) {
      return;
    }

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
      const duration = timeToMinutes(draggedTask.endTime) - timeToMinutes(draggedTask.startTime);
      const newStartMinutes = timeToMinutes(timeSlot);
      const newEndTime = minutesToTime(newStartMinutes + duration);

      const updatedTask = {
        ...draggedTask,
        machineId,
        startTime: timeSlot,
        endTime: newEndTime
      };

      // Check for conflicts before dropping
      const conflicts = checkConflicts(updatedTask, draggedTask.id);
      if (conflicts.length > 0) {
        alert(`Cannot drop here - conflicts with ${conflicts.length} existing task(s)`);
        setDraggedTask(null);
        return;
      }

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

  const unifiedTimeSlots = generateUnifiedTimeSlots();
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
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-around">
                <div className="text-center">
                  <strong className="h5 text-primary">{filteredTasks.length}</strong>
                  <br />
                  <small className="text-muted">Total Tasks</small>
                </div>
                <div className="text-center">
                  <strong className="h5 text-success">{machines.length}</strong>
                  <br />
                  <small className="text-muted">Active Machines</small>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gantt Chart Timeline View */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Machine Schedule - {new Date(selectedDate).toLocaleDateString()}</h5>
          <small className="text-muted">Drag tasks between slots and machines. Each machine has its own slot configuration.</small>
        </Card.Header>
        <Card.Body className="p-0">
          <div className="gantt-container">
            {/* Time Header */}
            <div className="gantt-header">
              <div className="gantt-machine-column">
                <div className="gantt-machine-header">
                  <strong>Machines</strong>
                  <br />
                  <small>Slot Duration</small>
                </div>
              </div>
              <div className="gantt-timeline">
                <div className="gantt-time-ruler">
                  {unifiedTimeSlots.filter((_, index) => index % 2 === 0).map(slot => (
                    <div key={slot} className="gantt-time-marker">
                      {slot}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Machine Rows */}
            <div className="gantt-body">
              {machines.map(machine => {
                const machineSlots = generateTimeSlotsForMachine(machine.MachineID);
                const machineConfig = config.machineConfigs[machine.MachineID] || { slotDuration: 30 };
                const machineTasks = filteredTasks.filter(t => t.machineId === machine.MachineID);

                return (
                  <div key={machine.MachineID} className="gantt-row">
                    {/* Machine Info Column */}
                    <div
                      className="gantt-machine-info"
                      style={{ backgroundColor: machineConfig.color }}
                    >
                      <div className="machine-details">
                        <strong>{machine.MachineName}</strong>
                        <div className="machine-code">{machine.MachineCode}</div>
                        <div className="slot-info">
                          {machineConfig.slotDuration} min slots
                        </div>
                        <div className="task-count">
                          {machineTasks.length} task{machineTasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    {/* Timeline Slots */}
                    <div className="gantt-timeline-row">
                      {machineSlots.map(slot => {
                        const tasksInSlot = filteredTasks.filter(
                          t => t.machineId === machine.MachineID &&
                               timeToMinutes(t.startTime) <= timeToMinutes(slot) &&
                               timeToMinutes(t.endTime) > timeToMinutes(slot)
                        );

                        const hasConflict = tasksInSlot.length > 1;
                        const slotWidth = (machineConfig.slotDuration / Math.min(...machines.map(m => config.machineConfigs[m.MachineID]?.slotDuration || 30))) * 60;

                        return (
                          <div
                            key={`${machine.MachineID}-${slot}`}
                            className={`gantt-slot ${tasksInSlot.length > 0 ? 'has-task' : ''} ${hasConflict ? 'has-conflict' : ''}`}
                            style={{
                              minWidth: `${slotWidth}px`,
                              width: `${slotWidth}px`
                            }}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, machine.MachineID, slot)}
                          >
                            {tasksInSlot.map((task, index) => (
                              <OverlayTrigger
                                key={task.id}
                                placement="top"
                                overlay={
                                  <Tooltip>
                                    <strong>{task.title}</strong><br />
                                    Machine: {machine.MachineName}<br />
                                    Time: {task.startTime} - {task.endTime} ({task.duration} min)<br />
                                    <em>{task.description}</em><br />
                                    Priority: {task.priority}<br />
                                    Status: {task.status}<br />
                                    {task.recurring && `Recurring: ${task.recurringType}`}
                                    {hasConflict && <><br /><span className="text-danger">⚠️ Conflict detected!</span></>}
                                  </Tooltip>
                                }
                              >
                                <div
                                  className={`gantt-task ${hasConflict ? 'conflict' : ''} ${task.recurring ? 'recurring' : ''}`}
                                  style={{
                                    backgroundColor: task.color,
                                    zIndex: index + 1,
                                    marginTop: hasConflict ? index * 4 : 0,
                                    height: hasConflict ? '35px' : '45px'
                                  }}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, task)}
                                  onClick={() => {
                                    setEditingTask(task);
                                    setShowTaskModal(true);
                                  }}
                                >
                                  <div className="gantt-task-content">
                                    <div className="gantt-task-title">{task.title}</div>
                                    <div className="gantt-task-time">{task.startTime}</div>
                                    <div className="gantt-task-meta">
                                      <Badge bg={task.status === 'in-progress' ? 'warning' : task.status === 'completed' ? 'success' : 'secondary'} size="sm">
                                        {task.status}
                                      </Badge>
                                      {task.priority === 'high' && <span className="priority-indicator">🔴</span>}
                                      {task.priority === 'medium' && <span className="priority-indicator">🟡</span>}
                                      {task.recurring && <span className="recurring-indicator">🔄</span>}
                                    </div>
                                  </div>
                                </div>
                              </OverlayTrigger>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
        timeSlots={unifiedTimeSlots}
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
    recurringType: "daily",
    priority: "medium",
    duration: 60
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
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Duration (minutes)</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Check
                type="checkbox"
                label="Recurring Task"
                checked={formData.recurring}
                onChange={(e) => setFormData({...formData, recurring: e.target.checked})}
                className="mt-4"
              />
            </Col>
          </Row>

          {formData.recurring && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Recurrence Pattern</Form.Label>
                  <Form.Select
                    value={formData.recurringType}
                    onChange={(e) => setFormData({...formData, recurringType: e.target.value})}
                  >
                    <option value="every30min">Every 30 minutes</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

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
  const [machines, setMachines] = useState([]);
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineCode, setNewMachineCode] = useState("");

  useEffect(() => {
    if (show) {
      loadMachines();
      setFormData(config);
    }
  }, [show, config]);

  const loadMachines = async () => {
    try {
      const res = await fetch(`${API_BASE}api/Machine/GetForListing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const data = await res.json();
      const machineList = data?.items?.lstResult1 || [];
      setMachines(machineList);
    } catch (err) {
      console.error("Error loading machines:", err);
    }
  };

  const handleAddMachine = async () => {
    if (!newMachineName.trim() || !newMachineCode.trim()) {
      alert("Please enter both machine name and code");
      return;
    }

    try {
      // In real app, this would be an API call
      const newMachine = {
        MachineID: Date.now(),
        MachineName: newMachineName,
        MachineCode: newMachineCode,
        IsActive: true,
        Details: "",
        Remarks: ""
      };

      setMachines(prev => [...prev, newMachine]);
      setNewMachineName("");
      setNewMachineCode("");
      alert("Machine added successfully!");
    } catch (err) {
      console.error("Error adding machine:", err);
    }
  };

  const handleRemoveMachine = async (machineId) => {
    if (!window.confirm("Are you sure you want to remove this machine?")) return;

    try {
      // In real app, this would be an API call
      setMachines(prev => prev.filter(m => m.MachineID !== machineId));
      alert("Machine removed successfully!");
    } catch (err) {
      console.error("Error removing machine:", err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Scheduler Configuration</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="config-tabs">
          {/* Time Configuration */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Global Time Configuration</h6>
            </Card.Header>
            <Card.Body>
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
                  <Form.Label>Working Days</Form.Label>
                  <div className="d-flex gap-2 flex-wrap">
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
              </Form>
            </Card.Body>
          </Card>

          {/* Individual Machine Configuration */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Individual Machine Slot Configuration</h6>
            </Card.Header>
            <Card.Body>
              <div className="machine-config-list">
                {machines.map(machine => {
                  const machineConfig = formData.machineConfigs[machine.MachineID] || { slotDuration: 30, color: '#e3f2fd' };
                  return (
                    <div key={machine.MachineID} className="machine-config-item mb-3 p-3 border rounded">
                      <Row className="align-items-center">
                        <Col md={3}>
                          <div>
                            <strong>{machine.MachineName}</strong>
                            <br />
                            <small className="text-muted">{machine.MachineCode}</small>
                          </div>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Slot Duration</Form.Label>
                            <Form.Select
                              value={machineConfig.slotDuration}
                              onChange={(e) => {
                                const newConfigs = {
                                  ...formData.machineConfigs,
                                  [machine.MachineID]: {
                                    ...machineConfig,
                                    slotDuration: parseInt(e.target.value)
                                  }
                                };
                                setFormData({...formData, machineConfigs: newConfigs});
                              }}
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={60}>1 hour</option>
                              <option value={120}>2 hours</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <Form.Group>
                            <Form.Label>Row Color</Form.Label>
                            <div className="d-flex gap-2">
                              {['#e3f2fd', '#f3e5f5', '#e8f5e8', '#fff3e0', '#fce4ec'].map(color => (
                                <div
                                  key={color}
                                  className={`color-picker ${machineConfig.color === color ? 'selected' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    const newConfigs = {
                                      ...formData.machineConfigs,
                                      [machine.MachineID]: {
                                        ...machineConfig,
                                        color
                                      }
                                    };
                                    setFormData({...formData, machineConfigs: newConfigs});
                                  }}
                                ></div>
                              ))}
                            </div>
                          </Form.Group>
                        </Col>
                        <Col md={3}>
                          <div className="slot-preview">
                            <small className="text-muted">Preview:</small>
                            <div className="slot-preview-bar" style={{ backgroundColor: machineConfig.color }}>
                              {machineConfig.slotDuration} min slots
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  );
                })}
              </div>
            </Card.Body>
          </Card>

          {/* Machine Management */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">Machine Management</h6>
            </Card.Header>
            <Card.Body>
              {/* Add New Machine */}
              <div className="add-machine-section mb-4 p-3 bg-light rounded">
                <h6>Add New Machine</h6>
                <Row>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Machine Name</Form.Label>
                      <Form.Control
                        type="text"
                        value={newMachineName}
                        onChange={(e) => setNewMachineName(e.target.value)}
                        placeholder="Enter machine name"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Machine Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={newMachineCode}
                        onChange={(e) => setNewMachineCode(e.target.value)}
                        placeholder="Enter machine code"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4} className="d-flex align-items-end">
                    <Button variant="primary" onClick={handleAddMachine}>
                      Add Machine
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Existing Machines */}
              <div className="machines-list">
                <h6>Existing Machines</h6>
                <div className="machine-cards">
                  {machines.map(machine => (
                    <div key={machine.MachineID} className="machine-card d-flex justify-content-between align-items-center p-3 border rounded mb-2">
                      <div>
                        <strong>{machine.MachineName}</strong>
                        <br />
                        <small className="text-muted">{machine.MachineCode}</small>
                      </div>
                      <div>
                        <Badge bg={machine.IsActive ? "success" : "secondary"}>
                          {machine.IsActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="ms-2"
                          onClick={() => handleRemoveMachine(machine.MachineID)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="d-flex justify-content-end gap-2">
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Configuration
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
