import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ShareButton from '../../components/ShareButton';

const shareProps = {
  locale: 'en' as const,
  title: 'Ada | GitHub portfolio',
  text: 'Ada’s selected projects and repository languages.',
  url: 'https://portfolio.example.test/ada?lang=en',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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
});
