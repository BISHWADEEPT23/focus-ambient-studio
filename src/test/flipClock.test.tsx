import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FlipDigit } from '../components/FlipDigit';
import { FlipCard } from '../components/FlipCard';
import { TimerHero } from '../components/TimerHero';
import { TimerState } from '../types';

describe('Flip Clock Split-Flap Unit Tests', () => {
  it('renders a FlipDigit with current digit and top/bottom cards', () => {
    const { container } = render(<FlipDigit digit={7} label="test-digit" />);

    // Screen-reader / aria label should present current digit
    expect(screen.getByLabelText('test-digit 7')).toBeInTheDocument();

    // Verify top and bottom cards exist
    const cards = container.querySelectorAll('.flip-card-top, .flip-card-bottom');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('decomposes a two-digit number into tens and units with FlipCard', () => {
    const { container } = render(<FlipCard value={42} label="Minutes" />);

    // Label should be displayed
    expect(screen.getByText('Minutes')).toBeInTheDocument();

    // Two digits (4 and 2) should be present
    expect(screen.getByLabelText('Minutes tens 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes units 2')).toBeInTheDocument();

    // Split hinge line should be rendered
    const hinges = container.querySelectorAll('.flip-hinge-line');
    expect(hinges.length).toBe(2);
  });

  it('respects reducedMotion by suppressing flap animation classes', () => {
    const { container, rerender } = render(<FlipDigit digit={3} reducedMotion={true} />);
    
    // Rerender with a new digit
    rerender(<FlipDigit digit={4} reducedMotion={true} />);

    // Should NOT contain the animated folding flaps
    const topFlap = container.querySelector('.animate-flip-top');
    const bottomFlap = container.querySelector('.animate-flip-bottom');
    expect(topFlap).toBeNull();
    expect(bottomFlap).toBeNull();
  });

  it('triggers flip flaps when digit changes under normal motion', () => {
    const { container, rerender } = render(<FlipDigit digit={1} reducedMotion={false} />);
    
    // Changing the digit initiates the flip transition
    rerender(<FlipDigit digit={2} reducedMotion={false} />);

    const topFlap = container.querySelector('.animate-flip-top');
    const bottomFlap = container.querySelector('.animate-flip-bottom');
    expect(topFlap).toBeInTheDocument();
    expect(bottomFlap).toBeInTheDocument();
  });

  it('renders full TimerHero in flip mode with HH:MM:SS or MM:SS structure', () => {
    const mockState: TimerState = {
      mode: 'pomodoro',
      status: 'running',
      timeRemaining: 1500, // 25:00
      totalDuration: 1500,
      elapsedSeconds: 0,
      completedCycles: 0,
    };

    render(
      <TimerHero
        timerState={mockState}
        timerStyle="flip"
        reducedMotion={false}
        onStart={() => {}}
        onPause={() => {}}
        onReset={() => {}}
        onModeSelect={() => {}}
        onToggleTimerStyle={() => {}}
      />
    );

    // Verify Minutes and Seconds flip cards are displayed
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes tens 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes units 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Seconds tens 0')).toBeInTheDocument();
    expect(screen.getByLabelText('Seconds units 0')).toBeInTheDocument();
  });
});
