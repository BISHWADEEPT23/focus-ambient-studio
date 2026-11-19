import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../App';

describe('App Root Integration Tests', () => {
  it('renders without crashing and displays initial timer and controls', () => {
    render(<App />);

    // Verify presence of start focus button and modes
    expect(screen.getByText('Start Focus')).toBeInTheDocument();
    expect(screen.getByText('Pomodoro')).toBeInTheDocument();
    expect(screen.getByText('Short Break')).toBeInTheDocument();
    expect(screen.getByText('Ambient Mode')).toBeInTheDocument();
  });

  it('toggles mode from Focus to Ambient and displays mini timer', () => {
    render(<App />);

    const modeButton = screen.getByText('Ambient Mode');
    fireEvent.click(modeButton);

    // Should now show Focus Mode button to switch back
    expect(screen.getByText('Focus Mode')).toBeInTheDocument();
  });

  it('opens and closes soundscapes audio mixer modal', () => {
    render(<App />);

    const soundsBtn = screen.getByText('Sounds');
    fireEvent.click(soundsBtn);

    expect(screen.getByText('Procedural Soundscapes')).toBeInTheDocument();
    expect(screen.getByText('Gentle Rain')).toBeInTheDocument();
    expect(screen.getByText('Ocean Waves')).toBeInTheDocument();

    const closeBtn = screen.getByLabelText('Close mixer');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Procedural Soundscapes')).not.toBeInTheDocument();
  });

  it('opens and closes task drawer and allows creating a task', () => {
    render(<App />);

    const tasksBtn = screen.getByText('Tasks');
    fireEvent.click(tasksBtn);

    expect(screen.getByText('Focus Tasks')).toBeInTheDocument();

    const input = screen.getByPlaceholderText('Add a new task...');
    fireEvent.change(input, { target: { value: 'Write Comprehensive Essay on Federalism' } });

    const addBtn = screen.getByText('Add Task');
    fireEvent.click(addBtn);

    const matches = screen.getAllByText('Write Comprehensive Essay on Federalism');
    expect(matches.length).toBeGreaterThanOrEqual(1);

    const closeBtn = screen.getByLabelText('Close task drawer');
    fireEvent.click(closeBtn);
  });
});
