import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ShareButton from '../../components/ShareButton';

const shareProps = {
  locale: 'en' as const,
  title: 'Ada | GitHub portfolio',
  text: 'Ada’s selected projects and repository languages.',
  url: 'https://portfolio.example.test/ada?lang=en',
};

// Keep in sync with the dismissal delays in components/ShareButton.tsx.
const SUCCESS_DISMISS_MS = 4000;
const ERROR_DISMISS_MS = 8000;

/** Lets every already-resolved promise in the share handler settle. */
async function flushPendingShare() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

async function clickShare() {
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  await flushPendingShare();
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ShareButton', () => {
  it('uses native sharing with localized portfolio data when Web Share is available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { share, clipboard: { writeText } });

    render(<ShareButton {...shareProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Portfolio shared.');
    expect(share).toHaveBeenCalledWith({
      title: shareProps.title,
      text: shareProps.text,
      url: shareProps.url,
    });
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies the canonical localized URL when native sharing is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareButton {...shareProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Link copied to clipboard.');
    expect(writeText).toHaveBeenCalledWith(shareProps.url);
  });

  it('shows an accessible error when clipboard access fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareButton {...shareProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Share' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'The link could not be copied. Copy it from the address bar instead.'
    );
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('treats a dismissed native share sheet as a non-error', async () => {
    const abortError = new Error('Share dismissed');
    abortError.name = 'AbortError';
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abortError) });

    render(<ShareButton {...shareProps} />);
    const button = screen.getByRole('button', { name: 'Share' });
    fireEvent.click(button);

    await waitFor(() => expect(button).toBeEnabled());
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps the action hidden in print layouts', () => {
    vi.stubGlobal('navigator', {});
    render(<ShareButton {...shareProps} />);

    expect(screen.getByRole('button', { name: 'Share' })).toHaveClass('no-print');
  });

  it('clears the success toast on its own after the success delay', async () => {
    vi.useFakeTimers();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

    render(<ShareButton {...shareProps} />);
    await clickShare();

    expect(screen.getByRole('status')).toHaveTextContent('Portfolio shared.');

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SUCCESS_DISMISS_MS - 1);
    });
    expect(screen.getByRole('status')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('keeps error toasts longer than success toasts', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockRejectedValue(new Error('Clipboard permission denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(<ShareButton {...shareProps} />);
    await clickShare();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SUCCESS_DISMISS_MS);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ERROR_DISMISS_MS - SUCCESS_DISMISS_MS);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets the reader dismiss the toast with the labelled close control', async () => {
    vi.useFakeTimers();
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

    render(<ShareButton {...shareProps} />);
    await clickShare();

    const toast = screen.getByRole('status');
    const close = within(toast).getByRole('button', { name: 'Dismiss notification' });
    expect(toast).toHaveClass('no-print');

    fireEvent.click(close);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    // The manual dismissal also drops the pending timer, so nothing reappears.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ERROR_DISMISS_MS);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('drops the pending dismissal when it unmounts', async () => {
    vi.useFakeTimers();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, clipboard: { writeText: vi.fn() } });

    const { unmount } = render(<ShareButton {...shareProps} />);
    await clickShare();
    expect(screen.getByRole('status')).toBeInTheDocument();

    unmount();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ERROR_DISMISS_MS);
    });

    const unmountedWarnings = consoleError.mock.calls.filter(
      ([message]) => typeof message === 'string' && /unmount/i.test(message)
    );
    expect(unmountedWarnings).toEqual([]);
  });

  it('does not let a stale timer wipe a newer message', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('navigator', { share: vi.fn().mockResolvedValue(undefined) });

    render(<ShareButton {...shareProps} />);
    await clickShare();
    expect(screen.getByRole('status')).toHaveTextContent('Portfolio shared.');

    // Second attempt fails, so the pending success timer must not clear the error.
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(new Error('no sheet')) });
    await clickShare();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'The share sheet could not be opened. Copy the link from the address bar instead.'
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SUCCESS_DISMISS_MS);
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(ERROR_DISMISS_MS - SUCCESS_DISMISS_MS);
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
