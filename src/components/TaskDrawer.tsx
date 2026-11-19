import React, { useState } from 'react';
import { X, Plus, Trash2, Check, Star, ChevronDown, ChevronRight } from 'lucide-react';
import { TaskItem, TaskPriority } from '../types';

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onAddTask: (title: string, priority: TaskPriority, subjectTag?: string, estimatedPomodoros?: number) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onSetFocusTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
}

const SUBJECT_OPTIONS = ['General', 'UPSC-Polity', 'UPSC-History', 'RBI-Finance', 'RBI-Management', 'Code/Tech', 'Reading'];

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  isOpen,
  onClose,
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onSetFocusTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [subjectTag, setSubjectTag] = useState('General');
  const [estPomodoros, setEstPomodoros] = useState(2);
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddTask(newTitle, priority, subjectTag, estPomodoros);
    setNewTitle('');
  };

  const toggleExpand = (taskId: string) => {
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleSubtaskSubmit = (taskId: string) => {
    const title = newSubtaskTitle[taskId];
    if (!title || !title.trim()) return;
    onAddSubtask(taskId, title);
    setNewSubtaskTitle((prev) => ({ ...prev, [taskId]: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md h-full bg-neutral-900 border-l border-neutral-800 p-6 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-white">Focus Tasks</h2>
            <p className="text-xs text-neutral-400">Designate your focus priority for active intervals</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all"
            aria-label="Close task drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Task Creator Form */}
        <form onSubmit={handleSubmit} className="py-4 border-b border-neutral-800 space-y-3">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500"
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-primary-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={subjectTag}
              onChange={(e) => setSubjectTag(e.target.value)}
              className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-300 focus:outline-none focus:border-primary-500"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] text-neutral-400">Est:</span>
              <input
                type="number"
                min="1"
                max="10"
                value={estPomodoros}
                onChange={(e) => setEstPomodoros(parseInt(e.target.value) || 1)}
                className="w-12 px-2 py-1 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-center text-white focus:outline-none focus:border-primary-500"
              />
              <span className="text-[11px] text-neutral-400">🍅</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </form>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No tasks yet. Create one above to anchor your focus session!
            </div>
          ) : (
            tasks.map((task) => {
              const isExpanded = !!expandedTasks[task.id];
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    task.isCurrentFocus
                      ? 'bg-primary-950/20 border-primary-600/40 shadow-sm'
                      : task.completed
                      ? 'bg-neutral-950/40 border-neutral-800/40 opacity-60'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox */}
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'border-neutral-700 hover:border-primary-500'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </button>

                    {/* Title and tags */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-medium text-white truncate ${
                            task.completed ? 'line-through text-neutral-500' : ''
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.isCurrentFocus && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-primary-500/20 text-primary-300">
                            FOCUS
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {task.subjectTag && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-800 text-neutral-400">
                            {task.subjectTag}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-500">
                          {task.completedPomodoros} / {task.estimatedPomodoros} 🍅
                        </span>
                      </div>
                    </div>

                    {/* Actions: Set Focus & Delete */}
                    <div className="flex items-center gap-1">
                      {!task.completed && (
                        <button
                          onClick={() => onSetFocusTask(task.id)}
                          className={`p-1 rounded-md transition-all ${
                            task.isCurrentFocus
                              ? 'text-amber-400'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                          title="Set as Focus Priority"
                        >
                          <Star className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleExpand(task.id)}
                        className="p-1 text-neutral-500 hover:text-neutral-300"
                        title="Toggle Subtasks"
                      >
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-1 text-neutral-500 hover:text-rose-400"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subtasks Accordion */}
                  {isExpanded && (
                    <div className="mt-3 pl-6 pt-2 border-t border-neutral-800/60 space-y-2">
                      {task.subtasks.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs text-neutral-300">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sub.completed}
                              onChange={() => onToggleSubtask(task.id, sub.id)}
                              className="w-3.5 h-3.5 rounded border-neutral-700 text-primary-600 accent-primary-600"
                            />
                            <span className={sub.completed ? 'line-through text-neutral-500' : ''}>
                              {sub.title}
                            </span>
                          </label>
                          <button
                            onClick={() => onDeleteSubtask(task.id, sub.id)}
                            className="text-neutral-600 hover:text-rose-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}

                      {/* Add subtask input */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Add subtask..."
                          value={newSubtaskTitle[task.id] || ''}
                          onChange={(e) =>
                            setNewSubtaskTitle((prev) => ({ ...prev, [task.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubtaskSubmit(task.id);
                          }}
                          className="flex-1 px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-xs text-white focus:outline-none focus:border-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubtaskSubmit(task.id)}
                          className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 rounded-lg"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
