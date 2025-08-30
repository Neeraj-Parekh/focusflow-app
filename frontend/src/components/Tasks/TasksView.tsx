import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Alert,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  PlayArrow,
  CheckCircle,
  Schedule,
  Flag,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAppSelector } from '../../hooks/useAppSelector';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import {
  addTask,
  updateTask,
  deleteTask,
  toggleTaskStatus,
  setFilter,
  reorderTasks,
} from '../../store/slices/tasksSlice';
import { setCurrentTask } from '../../store/slices/timerSlice';

interface TaskFormData {
  title: string;
  description: string;
  projectId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedPomodoros: number;
  dueDate: string;
  tags: string[];
}

const TasksView: React.FC = () => {
  const dispatch = useAppDispatch();
  const { tasks, filter } = useAppSelector((state) => state.tasks);
  const projects = useAppSelector((state) => state.projects.projects);
  const [taskMenuAnchor, setTaskMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    description: '',
    projectId: 'default',
    priority: 'medium',
    estimatedPomodoros: 1,
    dueDate: '',
    tags: [],
  });

  const filteredTasks = tasks.filter((task) => {
    if (filter.status !== 'all' && task.status !== filter.status) return false;
    if (filter.priority !== 'all' && task.priority !== filter.priority) return false;
    if (filter.projectId && task.projectId !== filter.projectId) return false;
    return true;
  });

  const handleAddTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      projectId: 'default',
      priority: 'medium',
      estimatedPomodoros: 1,
      dueDate: '',
      tags: [],
    });
    setIsTaskDialogOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setEditingTask(taskId);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        projectId: task.projectId,
        priority: task.priority,
        estimatedPomodoros: task.estimatedPomodoros,
        dueDate: task.dueDate ? task.dueDate.toISOString().split('T')[0] : '',
        tags: task.tags,
      });
      setIsTaskDialogOpen(true);
    }
    setTaskMenuAnchor(null);
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;

    const taskData = {
      title: taskForm.title,
      description: taskForm.description,
      projectId: taskForm.projectId,
      priority: taskForm.priority,
      status: 'pending' as const,
      estimatedPomodoros: taskForm.estimatedPomodoros,
      completedPomodoros: 0,
      dueDate: taskForm.dueDate ? new Date(taskForm.dueDate) : undefined,
      tags: taskForm.tags,
    };

    if (editingTask) {
      dispatch(updateTask({ id: editingTask, updates: taskData }));
    } else {
      dispatch(addTask(taskData));
    }

    setIsTaskDialogOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    dispatch(deleteTask(taskId));
    setTaskMenuAnchor(null);
  };

  const handleStartTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      dispatch(setCurrentTask(task));
      // Navigate to timer view would be handled by parent router
    }
    setTaskMenuAnchor(null);
  };

  const handleTaskMenuClick = (event: React.MouseEvent<HTMLElement>, taskId: string) => {
    setTaskMenuAnchor(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    dispatch(reorderTasks({
      startIndex: result.source.index,
      endIndex: result.destination.index,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle color="success" />;
      case 'in-progress': return <PlayArrow color="primary" />;
      default: return <Schedule color="disabled" />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="bold">
          Tasks
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddTask}
          sx={{ borderRadius: 2 }}
        >
          Add Task
        </Button>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filter.status}
              label="Status"
              onChange={(e) => dispatch(setFilter({ status: e.target.value as any }))}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in-progress">In Progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Priority</InputLabel>
            <Select
              value={filter.priority}
              label="Priority"
              onChange={(e) => dispatch(setFilter({ priority: e.target.value as any }))}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Project</InputLabel>
            <Select
              value={filter.projectId || ''}
              label="Project"
              onChange={(e) => dispatch(setFilter({ projectId: e.target.value || null }))}
            >
              <MenuItem value="">All Projects</MenuItem>
              {projects.map((project) => (
                <MenuItem key={project.id} value={project.id}>
                  {project.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Task List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="tasks">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <AnimatePresence>
                {filteredTasks.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          ...provided.draggableProps.style,
                          marginBottom: 16,
                        }}
                      >
                        <Card
                          sx={{
                            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {getStatusIcon(task.status)}
                                  <Typography
                                    variant="h6"
                                    sx={{
                                      ml: 1,
                                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                      opacity: task.status === 'completed' ? 0.7 : 1,
                                    }}
                                  >
                                    {task.title}
                                  </Typography>
                                </Box>
                                {task.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {task.description}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <Chip
                                    size="small"
                                    icon={<Flag />}
                                    label={task.priority}
                                    color={getPriorityColor(task.priority) as any}
                                    variant="outlined"
                                  />
                                  <Chip
                                    size="small"
                                    label={`${task.completedPomodoros}/${task.estimatedPomodoros} 🍅`}
                                    variant="outlined"
                                  />
                                  {task.dueDate && (
                                    <Chip
                                      size="small"
                                      label={`Due: ${task.dueDate.toLocaleDateString()}`}
                                      variant="outlined"
                                      color={new Date(task.dueDate) < new Date() ? 'error' : 'default'}
                                    />
                                  )}
                                  {task.tags.map((tag) => (
                                    <Chip key={tag} size="small" label={tag} variant="outlined" />
                                  ))}
                                </Box>
                              </Box>
                              <IconButton
                                onClick={(e) => handleTaskMenuClick(e, task.id)}
                                size="small"
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filteredTasks.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No tasks found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create your first task to get started with focused work sessions
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={handleAddTask}>
            Add Task
          </Button>
        </Box>
      )}

      {/* Task Menu */}
      <Menu
        anchorEl={taskMenuAnchor}
        open={Boolean(taskMenuAnchor)}
        onClose={() => setTaskMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleStartTask(selectedTaskId)}>
          <PlayArrow sx={{ mr: 1 }} />
          Start Task
        </MenuItem>
        <MenuItem onClick={() => dispatch(toggleTaskStatus(selectedTaskId))}>
          <CheckCircle sx={{ mr: 1 }} />
          Toggle Complete
        </MenuItem>
        <MenuItem onClick={() => handleEditTask(selectedTaskId)}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => handleDeleteTask(selectedTaskId)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onClose={() => setIsTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Task Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Project</InputLabel>
                <Select
                  value={taskForm.projectId}
                  label="Project"
                  onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                >
                  {projects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={taskForm.priority}
                  label="Priority"
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Pomodoros"
                type="number"
                value={taskForm.estimatedPomodoros}
                onChange={(e) => setTaskForm({ ...taskForm, estimatedPomodoros: parseInt(e.target.value) || 1 })}
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Due Date"
                type="date"
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained">
            {editingTask ? 'Update' : 'Create'} Task
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TasksView;