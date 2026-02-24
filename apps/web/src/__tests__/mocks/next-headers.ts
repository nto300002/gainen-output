export const cookies = jest.fn(async () => ({
  toString: () => "session=test",
  get: jest.fn(),
  has: jest.fn(() => false),
}));
