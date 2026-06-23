import { metersBetween } from './places.provider';

describe('metersBetween', () => {
  it('returns zero for the same coordinate', () => {
    expect(metersBetween(37.5, 127, 37.5, 127)).toBe(0);
  });

  it('returns a positive, symmetric distance', () => {
    const there = metersBetween(37.5, 127, 37.51, 127.01);
    expect(there).toBeGreaterThan(1000);
    expect(metersBetween(37.51, 127.01, 37.5, 127)).toBe(there);
  });
});
