jest.mock('@/lib/tokenStorage', () => ({
  getToken: jest.fn(),
}));

import { api, ApiError, API_URL } from '@/lib/api';
import { getToken } from '@/lib/tokenStorage';

function mockFetchResponse(status: number, body?: unknown) {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

describe('api client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it('includes an Authorization header when a token is stored', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('my-token');
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(200, { ok: true }));

    await api.get('/me');

    expect(global.fetch).toHaveBeenCalledWith(
      `${API_URL}/me`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
      })
    );
  });

  it('omits the Authorization header when there is no stored token', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce(null);
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(200, {}));

    await api.get('/foods');

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('never reads the token for a request made with auth: false', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(200, { token: 'x' }));

    await api.post('/login', { email: 'a@b.com', password: 'pw' }, { auth: false });

    expect(getToken).not.toHaveBeenCalled();
    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('JSON-stringifies the request body for POST/PUT', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('tok');
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(200, {}));

    await api.put('/entries/1', { quantity: 2 });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(options.method).toBe('PUT');
    expect(options.body).toBe(JSON.stringify({ quantity: 2 }));
  });

  it('returns undefined for a 204 No Content response without parsing a body', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('tok');
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(204));

    const result = await api.delete('/entries/1');

    expect(result).toBeUndefined();
  });

  it('returns the parsed JSON body on success', async () => {
    (getToken as jest.Mock).mockResolvedValueOnce('tok');
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(200, { foods: [{ id: '1' }] }));

    const result = await api.get<{ foods: Array<{ id: string }> }>('/foods');

    expect(result).toEqual({ foods: [{ id: '1' }] });
  });

  it('throws an ApiError with the status and server-provided message on a non-ok response', async () => {
    (getToken as jest.Mock).mockResolvedValue('tok');
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse(404, { error: 'Entry not found' }));

    await expect(api.get('/entries/missing')).rejects.toMatchObject({
      status: 404,
      message: 'Entry not found',
    });
    await expect(api.get('/entries/missing2')).rejects.toBeInstanceOf(ApiError);
  });

  it('falls back to a generic message when a non-ok response has no error field', async () => {
    (getToken as jest.Mock).mockResolvedValue('tok');
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockFetchResponse(500));

    await expect(api.get('/boom')).rejects.toMatchObject({
      status: 500,
      message: 'Something went wrong. Please try again.',
    });
  });
});
