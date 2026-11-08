import { describe, expect, it } from 'vitest';
import { semesterWeek, streakLength } from './streak';
import { neededGpa, bestFinish, difficulty } from '../screens/student/Home';

const wed = new Date(2026, 9, 21); // Wednesday 21 Oct 2026

describe('streak', () => {
  it('counts consecutive weekdays up to today', () => {
    expect(streakLength(['2026-10-19', '2026-10-20', '2026-10-21'], wed)).toBe(3);
  });
  it("doesn't break before today is done", () => {
    expect(streakLength(['2026-10-19', '2026-10-20'], wed)).toBe(2);
  });
  it('a missed weekday breaks it', () => {
    expect(streakLength(['2026-10-16', '2026-10-20', '2026-10-21'], wed)).toBe(2);
  });
  it('weekends never break it, and count when studied', () => {
    expect(streakLength(['2026-10-15', '2026-10-16', '2026-10-19', '2026-10-20', '2026-10-21'], wed)).toBe(5);
    expect(streakLength(['2026-10-16', '2026-10-17', '2026-10-19', '2026-10-20', '2026-10-21'], wed)).toBe(5);
  });
  it('is zero with nothing', () => { expect(streakLength([], wed)).toBe(0); });
});

describe('CGPA maths', () => {
  it('matches the plan numbers (4.00 after 96 of 240 units)', () => {
    expect(neededGpa(4.5, 4.0, 96, 240)).toBeCloseTo(4.833, 3);
    expect(neededGpa(4.0, 4.0, 96, 240)).toBeCloseTo(4.0, 5);
    expect(neededGpa(3.5, 4.0, 96, 240)).toBeCloseTo(3.167, 3);
    expect(bestFinish(4.0, 96, 240)).toBeCloseTo(4.6, 5);
  });
  it('labels difficulty honestly', () => {
    expect(difficulty(5.2).label).toBe('Out of reach');
    expect(difficulty(4.83).label).toBe('Very difficult');
    expect(difficulty(4.0).label).toBe('Achievable');
  });
  it('has nothing to plan once every unit is done', () => {
    expect(Number.isNaN(neededGpa(4.5, 4.0, 240, 240))).toBe(true);
  });
});

describe('semesterWeek', () => {
  const d = (s: string) => new Date(`${s}T10:00:00`);
  it('is hidden until the admin sets a start date, and before lectures start', () => {
    expect(semesterWeek(null, 12, d('2026-11-08'))).toBeNull();
    expect(semesterWeek('2026-11-09', 12, d('2026-11-08'))).toBeNull();
  });
  it('counts weeks from the start date', () => {
    expect(semesterWeek('2026-11-02', 12, d('2026-11-02'))).toBe(1);
    expect(semesterWeek('2026-11-02', 12, d('2026-11-08'))).toBe(1);
    expect(semesterWeek('2026-11-02', 12, d('2026-11-09'))).toBe(2);
  });
  it('stops at the last week', () => {
    expect(semesterWeek('2026-01-05', 12, d('2026-11-08'))).toBe(12);
  });
});
