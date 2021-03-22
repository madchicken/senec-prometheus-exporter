import { hex2float } from '../utils';

describe('Utilities functions', () => {
  it('should convert an hex number into float', () => {
    expect(hex2float('453EEE73')).toBe(3054.9);
    expect(hex2float('C436C444')).toBe(-731.07);
    expect(hex2float('43A2322C')).toBe(324.39);
    expect(hex2float('44929F5C')).toBe(1172.98);
    expect(hex2float('42C20000')).toBe(97);
  });
});
