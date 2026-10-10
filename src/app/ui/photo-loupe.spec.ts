import { loupeOrigin } from './photo-loupe';

describe('loupeOrigin', () => {
  const frame = { left: 100, top: 50, width: 400, height: 600 };

  it('magnifies around the point under the pointer', () => {
    expect(loupeOrigin(frame, 200, 350)).toEqual({ x: '25%', y: '50%' });
  });

  it('stays inside the photograph when the pointer crosses its edge', () => {
    expect(loupeOrigin(frame, 40, 700)).toEqual({ x: '0%', y: '100%' });
  });
});
