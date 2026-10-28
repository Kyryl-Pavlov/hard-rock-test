import { sendGAEvent } from '@next/third-parties/google';
import { trackEvent } from '@/lib/analytics';

jest.mock('@next/third-parties/google', () => ({ sendGAEvent: jest.fn() }));

const originalGaId = process.env.NEXT_PUBLIC_GA_ID;

afterEach(() => {
  process.env.NEXT_PUBLIC_GA_ID = originalGaId;
  jest.resetAllMocks();
});

describe('trackEvent', () => {
  it('does nothing when GA is not configured', () => {
    delete process.env.NEXT_PUBLIC_GA_ID;

    trackEvent('characters_page_loaded', { page: 2 });

    expect(sendGAEvent).not.toHaveBeenCalled();
  });

  it('sends the event to GA when it is configured', () => {
    process.env.NEXT_PUBLIC_GA_ID = 'G-TEST';

    trackEvent('characters_page_loaded', { page: 2 });

    expect(sendGAEvent).toHaveBeenCalledWith('event', 'characters_page_loaded', { page: 2 });
  });
});
