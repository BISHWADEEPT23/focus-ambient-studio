import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FlipDigit } from '../components/FlipDigit';
import { FlipCard } from '../components/FlipCard';
import { TimerHero } from '../components/TimerHero';
import { TimerState, TimerMode } from '../types';

describe('Flip Clock Split-Flap Unit & Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('1. Initial digit rendering — displays correct value and card structure', () => {
    const { container } = render(<FlipDigit digit={7} label="test-digit" />);

    expect(screen.getByLabelText('test-digit 7')).toBeInTheDocument();
    const digitCard = container.querySelector('[data-testid="flip-digit-card"]');
    expect(digitCard).toHaveAttribute('data-digit', '7');

    const topCards = container.querySelectorAll('.flip-card-top');
    const bottomCards = container.querySelectorAll('.flip-card-bottom');
    expect(topCards.length).toBeGreaterThanOrEqual(1);
    expect(bottomCards.length).toBeGreaterThanOrEqual(1);

    const hinge = container.querySelector('.flip-hinge-line');
    expect(hinge).toBeInTheDocument();
  });

  it('2. Decomposes a two-digit number into tens and units with FlipCard', () => {
    const { container } = render(<FlipCard value={42} label="Minutes" />);

    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes tens 4')).toBeInTheDocument();
    expect(screen.getByLabelText('Minutes units 2')).toBeInTheDocument();

    const hinges = container.querySelectorAll('.flip-hinge-line');
    expect(hinges.length).toBe(2);
  });

  it('3. Suppresses animation when reducedMotion is enabled', () => {
    const { container, rerender } = render(<FlipDigit digit={3} reducedMotion={true} />);
    
    rerender(<FlipDigit digit={4} reducedMotion={true} />);

    const rotatingCard = container.querySelector('.flip-rotating-card');
    const topFlap = container.querySelector('.animate-flip-top');
    const bottomFlap = container.querySelector('.animate-flip-bottom');

    expect(rotatingCard).toBeNull();
    expect(topFlap).toBeNull();
    expect(bottomFlap).toBeNull();
    expect(screen.getByLabelText('4')).toBeInTheDocument();
  });

  it('4. Correct 9->0 rollover transition with 3D rotating card', () => {
    const { container, rerender } = render(<FlipDigit digit={9} label="unit" />);

    act(() => {
      rerender(<FlipDigit digit={0} label="unit" />);
    });

    // Flipping card should be active
    const rotatingCard = container.querySelector('.flip-rotating-card');
    expect(rotatingCard).toBeInTheDocument();
    expect(rotatingCard).toHaveClass('is-flipping');

    // Fast-forward past the 750ms transition + 30ms guard fallback (780ms)
    act(() => {
      vi.advanceTimersByTime(800);
    });

    // Flap should commit back to idle showing 0
    expect(container.querySelector('.flip-rotating-card')).toBeNull();
    expect(screen.getByLabelText('unit 0')).toBeInTheDocument();
  });

  it('5. Correct 0->9 count-up / reverse transition', () => {
    const { container, rerender } = render(<FlipDigit digit={0} label="unit" />);

    act(() => {
      rerender(<FlipDigit digit={9} label="unit" />);
    });

    expect(container.querySelector('.flip-rotating-card')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(container.querySelector('.flip-rotating-card')).toBeNull();
    expect(screen.getByLabelText('unit 9')).toBeInTheDocument();
  });

  it('6. 750ms flip lifecycle and commit state machine', () => {
    const { container, rerender } = render(<FlipDigit digit={5} label="sec" />);

    act(() => {
      rerender(<FlipDigit digit={4} label="sec" />);
    });

    // At t = 200ms, flip is in flight
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(container.querySelector('.flip-rotating-card')).toBeInTheDocument();

    // At t = 800ms, flip has committed
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(container.querySelector('.flip-rotating-card')).toBeNull();
    expect(screen.getByLabelText('sec 4')).toBeInTheDocument();
  });

  it('7. Timer reset during animation immediately snaps to target without glitching', () => {
    const { container, rerender } = render(<FlipDigit digit={5} label="sec" />);

    // Start a flip from 5 -> 4
    act(() => {
      rerender(<FlipDigit digit={4} label="sec" />);
    });
    expect(container.querySelector('.flip-rotating-card')).toBeInTheDocument();

    // Sudden reset back to 0 (a jump greater than 1 digit)
    act(() => {
      rerender(<FlipDigit digit={0} label="sec" />);
    });

    // Should immediately snap to 0 without hanging
    expect(container.querySelector('.flip-rotating-card')).toBeNull();
    expect(screen.getByLabelText('sec 0')).toBeInTheDocument();
  });

  it('8. Rapid sequential digit changes queue smoothly without overlapping animations', () => {
    const { container, rerender } = render(<FlipDigit digit={1} label="sec" />);

    // First change: 1 -> 2
    act(() => {
      rerender(<FlipDigit digit={2} label="sec" />);
    });
    expect(container.querySelector('.flip-rotating-card')).toBeInTheDocument();

    // Rapid second change while first is in-flight: 2 -> 3
    act(() => {
      rerender(<FlipDigit digit={3} label="sec" />);
    });

    // Advance time for first animation to commit and microtask to run
    act(() => {
      vi.advanceTimersByTime(800);
    });

    // Advance for second queued animation to complete
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(screen.getByLabelText('sec 3')).toBeInTheDocument();
    expect(container.querySelector('.flip-rotating-card')).toBeNull();
  });

  it('9. Renders full TimerHero in flip mode with all 6 supported timer modes', () => {
    const modes: Array<{ mode: TimerMode; time: number; label: string; expectHours: boolean }> = [
      { mode: 'pomodoro', time: 1500, label: 'Pomodoro', expectHours: false },
      { mode: 'shortBreak', time: 300, label: 'Short Break', expectHours: false },
      { mode: 'longBreak', time: 900, label: 'Long Break', expectHours: false },
      { mode: 'countdown', time: 3600, label: 'Countdown', expectHours: true },
      { mode: 'stopwatch', time: 3665, label: 'Stopwatch', expectHours: true },
      { mode: 'animedoro', time: 3000, label: 'Animedoro', expectHours: false },
    ];

    for (const testCase of modes) {
      const mockState: TimerState = {
        mode: testCase.mode,
        status: 'running',
        timeRemaining: testCase.time,
        totalDuration: testCase.time,
        elapsedSeconds: 0,
        completedCycles: 0,
      };

      const { unmount } = render(
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

      // Verify mode tab is rendered
      expect(screen.getByText(testCase.label)).toBeInTheDocument();

      // Verify Minutes and Seconds are always rendered
      expect(screen.getByText('Minutes')).toBeInTheDocument();
      expect(screen.getByText('Seconds')).toBeInTheDocument();

      // If hours > 0 (countdown 3600 or stopwatch 3665), Hours card should be present
      if (testCase.expectHours) {
        expect(screen.getByText('Hours')).toBeInTheDocument();
      }

      unmount();
    }
  });
});
