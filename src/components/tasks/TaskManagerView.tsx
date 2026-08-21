import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  Trash2,
  Edit2,
  Tag,
  AlertCircle,
  Zap,
  Filter,
  ArrowUpDown,
  Search,
  Check,
  X,
} from 'lucide-react';
import { TaskItem, TaskCategory, TaskPriority } from '../../types';
import { AudioService } from '../../services/audioService';
import { getLocalDateString } from '../../services/storage';

interface TaskManagerViewProps {
  tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onStartFocusForTask: (task: TaskItem) => void;
}

export const TaskManagerView: React.FC<TaskManagerViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTask,
  onStartFocusForTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed' | 'high'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  // Modal / Form state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<TaskCategory>('Study');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<string>(getLocalDateString());
  const [dueTime, setDueTime] = useState<string>('18:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [subject, setSubject] = useState<string>('');

  const categories: TaskCategory[] = ['Study', 'Assignment', 'Revision', 'Project', 'Exam Prep', 'Personal'];

  const openNewTaskModal = () => {
    AudioService.playTap();
    setEditingTaskId(null);
    setTitle('');
    setCategory('Study');
    setPriority('Medium');
    setDueDate(getLocalDateString());
    setDueTime('18:00');
    setEstimatedMinutes(45);
    setNotes('');
    setSubject('');
    setShowModal(true);
  };

  const openEditTaskModal = (task: TaskItem) => {
    AudioService.playTap();
    setEditingTaskId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setDueTime(task.dueTime || '');
    setEstimatedMinutes(task.estimatedMinutes || 45);
    setNotes(task.notes || '');
    setSubject(task.subject || '');
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    AudioService.playTap();
    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        onUpdateTask({
          ...existing,
          title: title.trim(),
          category,
          priority,
          dueDate: dueDate || undefined,
          dueTime: dueTime || undefined,
          estimatedMinutes,
          notes: notes.trim() || undefined,
          subject: subject.trim() || undefined,
        });
      }
    } else {
      onAddTask({
        title: title.trim(),
        category,
        priority,
        dueDate: dueDate || undefined,
        dueTime: dueTime || undefined,
        completed: false,
        estimatedMinutes,
        notes: notes.trim() || undefined,
        subject: subject.trim() || undefined,
      });
    }

    setShowModal(false);
  };

  // Filter & Sort Logic
  const todayStr = getLocalDateString();
  const safeTasks = tasks || [];

  const filteredTasks = safeTasks.filter((t) => {
    if (searchQuery.trim()) {
      const match =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!match) return false;
    }

    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;

    if (filter === 'today') {
      return !t.dueDate || t.dueDate === todayStr;
    }
    if (filter === 'upcoming') {
      return t.dueDate && t.dueDate > todayStr && !t.completed;
    }
    if (filter === 'completed') {
      return t.completed;
    }
    if (filter === 'high') {
      return t.priority === 'High' && !t.completed;
    }
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'dueDate') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    if (sortBy === 'priority') {
      const pMap = { High: 3, Medium: 2, Low: 1 };
      return pMap[b.priority] - pMap[a.priority];
    }
    return a.title.localeCompare(b.title);
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & New Task Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Task Manager
          </h2>
          <p className="text-xs text-slate-400">Organize assignments, syllabus items & study goals</p>
        </div>

        <button
          id="btn-add-new-task"
          onClick={openNewTaskModal}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          {/* Search Box */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, notes, subject..."
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
            />
          </div>

          {/* Sort Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-2.5 flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 focus:outline-none py-2"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'high', label: 'High Priority ⚡' },
            { id: 'completed', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                AudioService.playTap();
                setFilter(tab.id as any);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition ${
                filter === tab.id
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-white">No tasks match your criteria</p>
            <p className="text-[11px] text-slate-400">Add a new study task to stay on track.</p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 group ${
                task.completed
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : 'bg-slate-900/90 hover:bg-slate-850 border-slate-800/80 shadow-sm'
              }`}
            >
              {/* Checkbox & Details */}
              <div className="flex items-start space-x-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className="mt-0.5 text-slate-400 hover:text-blue-400 shrink-0 transition"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="min-w-0 space-y-1">
                  <p
                    className={`text-xs font-bold truncate ${
                      task.completed ? 'line-through text-slate-500' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="px-2 py-0.2 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                      {task.category}
                    </span>

                    {task.subject && (
                      <span className="text-blue-400 font-semibold">{task.subject}</span>
                    )}

                    {task.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {task.dueDate} {task.dueTime && `at ${task.dueTime}`}
                      </span>
                    )}

                    {task.estimatedMinutes && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {task.estimatedMinutes}m est.
                      </span>
                    )}
                  </div>

                  {task.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-1 italic">{task.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions & Priority */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {!task.completed && (
                  <button
                    onClick={() => onStartFocusForTask(task)}
                    className="p-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition"
                    title="Launch Focus Session for this task"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline text-[11px]">Focus</span>
                  </button>
                )}

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : task.priority === 'Medium'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {task.priority}
                </span>

                <button
                  onClick={() => openEditTaskModal(task)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition"
                  title="Edit Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    AudioService.playTap();
                    onDeleteTask(task.id);
                  }}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Task Edit / Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleSave}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {editingTaskId ? 'Edit Study Task' : 'Add New Study Task'}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Complete Graph Algorithms Assignment"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Due Date */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Due Time */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Due Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Estimated Minutes */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Est. Duration (Min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 45)}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. CS 301"
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Notes / Links</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional details or reference chapters..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30"
                >
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
