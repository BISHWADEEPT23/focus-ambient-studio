import { SubTask, TaskItem, TaskPriority } from '../../types';

// Clean monotonic ULID-style unique identifier generator
export function generateTaskId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `task_${timestamp}_${randomPart}`;
}

export class TaskEngine {
  private tasks: TaskItem[] = [];
  private onTasksChange?: (tasks: TaskItem[]) => void;

  constructor(initialTasks?: TaskItem[], onTasksChange?: (tasks: TaskItem[]) => void) {
    this.tasks = initialTasks ? [...initialTasks] : [];
    this.onTasksChange = onTasksChange;
  }

  public getTasks(): TaskItem[] {
    return [...this.tasks];
  }

  public getActiveFocusTask(): TaskItem | undefined {
    return this.tasks.find((t) => t.isCurrentFocus && !t.completed);
  }

  public addTask(title: string, priority: TaskPriority = 'medium', subjectTag?: string, estimatedPomodoros = 1): TaskItem {
    const newTask: TaskItem = {
      id: generateTaskId(),
      title: title.trim(),
      completed: false,
      priority,
      subjectTag,
      estimatedPomodoros: Math.max(1, estimatedPomodoros),
      completedPomodoros: 0,
      subtasks: [],
      createdAt: Date.now(),
      isCurrentFocus: this.tasks.length === 0, // Auto-focus if first task
    };

    this.tasks.push(newTask);
    this.notify();
    return newTask;
  }

  public toggleTaskCompletion(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? Date.now() : undefined;

    if (task.completed && task.isCurrentFocus) {
      task.isCurrentFocus = false;
      // Auto-assign focus to next uncompleted task
      const nextUnfinished = this.tasks.find((t) => !t.completed);
      if (nextUnfinished) {
        nextUnfinished.isCurrentFocus = true;
      }
    }

    this.notify();
  }

  public setFocusTask(taskId: string): void {
    for (const t of this.tasks) {
      t.isCurrentFocus = t.id === taskId;
    }
    this.notify();
  }

  public deleteTask(taskId: string): void {
    const wasFocus = this.tasks.find((t) => t.id === taskId)?.isCurrentFocus;
    this.tasks = this.tasks.filter((t) => t.id !== taskId);

    if (wasFocus) {
      const next = this.tasks.find((t) => !t.completed);
      if (next) next.isCurrentFocus = true;
    }

    this.notify();
  }

  public incrementCompletedPomodoros(taskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (task) {
      task.completedPomodoros += 1;
      this.notify();
    }
  }

  public addSubtask(taskId: string, subtaskTitle: string): SubTask | null {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return null;

    const sub: SubTask = {
      id: generateTaskId(),
      title: subtaskTitle.trim(),
      completed: false,
    };

    task.subtasks.push(sub);
    this.notify();
    return sub;
  }

  public toggleSubtask(taskId: string, subtaskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const sub = task.subtasks.find((s) => s.id === subtaskId);
    if (sub) {
      sub.completed = !sub.completed;
      this.notify();
    }
  }

  public deleteSubtask(taskId: string, subtaskId: string): void {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    task.subtasks = task.subtasks.filter((s) => s.id !== subtaskId);
    this.notify();
  }

  public reorderTasks(newOrder: TaskItem[]): void {
    this.tasks = [...newOrder];
    this.notify();
  }

  private notify(): void {
    if (this.onTasksChange) {
      this.onTasksChange(this.getTasks());
    }
  }
}
