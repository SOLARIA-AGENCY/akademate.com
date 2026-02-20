import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RealtimeProvider } from '@/@payload-config/components/providers/RealtimeProvider';

vi.mock('@akademate/realtime/context', () => ({
  SocketProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="socket-provider">{children}</div>
  ),
}));

function mockAuthSession() {
  vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();

    if (url.includes('/api/auth/session')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            authenticated: true,
            socketToken: 'socket-token',
            user: {
              id: '2',
              role: 'superadmin',
              tenantId: 1,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    return Promise.resolve(
      new Response(JSON.stringify({ error: 'not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
}

describe('RealtimeProvider', () => {
  beforeEach(() => {
    mockAuthSession();
  });

  it('does not mount socket provider when socket endpoint is unavailable', async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/auth/session')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              authenticated: true,
              socketToken: 'socket-token',
              user: { id: '2', role: 'superadmin', tenantId: 1 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      if (url.includes('/socket.io/?EIO=4')) {
        return Promise.resolve(new Response('<html>not socket</html>', { status: 200 }));
      }

      return Promise.resolve(new Response('{}', { status: 404 }));
    });

    render(
      <RealtimeProvider>
        <div>child content</div>
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('child content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('socket-provider')).not.toBeInTheDocument();
  });

  it('mounts socket provider when socket handshake endpoint is available', async () => {
    vi.mocked(global.fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.includes('/api/auth/session')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              authenticated: true,
              socketToken: 'socket-token',
              user: { id: '2', role: 'superadmin', tenantId: 1 },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }

      if (url.includes('/socket.io/?EIO=4')) {
        return Promise.resolve(new Response('0{"sid":"abc123"}', { status: 200 }));
      }

      return Promise.resolve(new Response('{}', { status: 404 }));
    });

    render(
      <RealtimeProvider>
        <div>child content</div>
      </RealtimeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('socket-provider')).toBeInTheDocument();
    });
    expect(screen.getByText('child content')).toBeInTheDocument();
  });
});
