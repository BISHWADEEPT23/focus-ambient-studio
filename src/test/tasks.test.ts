import { describe, it, expect } from 'vitest';
import { TaskEngine } from '../core/tasks/taskEngine';

describe('TaskEngine Unit Tests', () => {
  it('adds a task and auto-focuses the first task', () => {
    const engine = new TaskEngine();
    const task = engine.addTask('Complete UPSC Essay Mock', 'high', 'UPSC-Essay', 2);

    expect(task.title).toBe('Complete UPSC Essay Mock');
    expect(task.priority).toBe('high');
    expect(task.subjectTag).toBe('UPSC-Essay');
    expect(task.isCurrentFocus).toBe(true);
    expect(engine.getTasks().length).toBe(1);
    expect(engine.getActiveFocusTask()?.id).toBe(task.id);
  });

  it('manages subtasks within a task', () => {
    const engine = new TaskEngine();
    const task = engine.addTask('RBI Finance Ratio Analysis');
    const sub = engine.addSubtask(task.id, 'Calculate Current & Quick Ratios');

    expect(sub).not.toBeNull();
    expect(sub?.completed).toBe(false);

    engine.toggleSubtask(task.id, sub!.id);
    const updatedTask = engine.getTasks().find((t) => t.id === task.id);
    expect(updatedTask?.subtasks[0].completed).toBe(true);

    engine.deleteSubtask(task.id, sub!.id);
    expect(engine.getTasks()[0].subtasks.length).toBe(0);
  });

  it('completes task and shifts focus to next pending task', () => {
    const engine = new TaskEngine();
    const task1 = engine.addTask('Task 1');
    const task2 = engine.addTask('Task 2');

    expect(task1.isCurrentFocus).toBe(true);
    engine.toggleTaskCompletion(task1.id);

    expect(engine.getTasks().find((t) => t.id === task1.id)?.completed).toBe(true);
    expect(engine.getTasks().find((t) => t.id === task2.id)?.isCurrentFocus).toBe(true);
  });
});
