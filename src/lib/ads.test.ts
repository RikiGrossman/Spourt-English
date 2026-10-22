import { afterEach, describe, expect, it, vi } from 'vitest';

type Listener = () => void;

async function setup({ play = true, id = 'ca-app-pub-1/2', consent = 'NOT_REQUIRED', reward = true } = {}) {
  const listeners = new Map<string, Listener>();
  const AdMob = {
    requestConsentInfo: vi.fn(async () => ({
      status: consent,
      isConsentFormAvailable: true,
      canRequestAds: consent !== 'REQUIRED',
      privacyOptionsRequirementStatus: 'NOT_REQUIRED',
    })),
    showConsentForm: vi.fn(async () => ({
      status: 'OBTAINED',
      canRequestAds: true,
      privacyOptionsRequirementStatus: 'REQUIRED',
    })),
    initialize: vi.fn(async () => {}),
    prepareRewardVideoAd: vi.fn(async () => ({ adUnitId: id })),
    addListener: vi.fn(async (event: string, fn: Listener) => {
      listeners.set(event, fn);
      return { remove: vi.fn(async () => listeners.delete(event)) };
    }),
    // Like the native plugin: the video plays, may grant the reward, then closes.
    showRewardVideoAd: vi.fn(async () => {
      if (reward) listeners.get('onRewardedVideoAdReward')?.();
      listeners.get('onRewardedVideoAdDismissed')?.();
      return { type: 'coins', amount: 1 };
    }),
    showPrivacyOptionsForm: vi.fn(async () => {}),
  };
  vi.resetModules();
  vi.doMock('./update', () => ({ isPlayBuild: async () => play }));
  vi.doMock('@capacitor-community/admob', () => ({
    AdMob,
    AdmobConsentStatus: { REQUIRED: 'REQUIRED', OBTAINED: 'OBTAINED', NOT_REQUIRED: 'NOT_REQUIRED' },
    MaxAdContentRating: { Teen: 'Teen' },
    RewardAdPluginEvents: {
      Rewarded: 'onRewardedVideoAdReward',
      Dismissed: 'onRewardedVideoAdDismissed',
      FailedToShow: 'onRewardedVideoAdFailedToShow',
    },
  }));
  vi.stubEnv('VITE_ADMOB_REWARDED_ID', id);
  return { AdMob, listeners, ads: await import('./ads') };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.doUnmock('./update');
  vi.doUnmock('@capacitor-community/admob');
});

describe('rewarded ads', () => {
  it('are shown only in the Play build with an ad unit id', async () => {
    expect(await (await setup()).ads.adsSupported()).toBe(true);
    expect(await (await setup({ play: false })).ads.adsSupported()).toBe(false);
    expect(await (await setup({ id: '' })).ads.adsSupported()).toBe(false);
  });

  it('starts the SDK once and resolves true when the video was watched through', async () => {
    const { AdMob, listeners, ads } = await setup();
    expect(await ads.watchRewardedAd()).toBe(true);
    expect(await ads.watchRewardedAd()).toBe(true);
    expect(AdMob.initialize).toHaveBeenCalledTimes(1);
    expect(AdMob.prepareRewardVideoAd).toHaveBeenCalledWith({ adId: 'ca-app-pub-1/2', isTesting: false });
    expect(listeners.size).toBe(0);
  });

  it('resolves false when the video is closed early', async () => {
    const { ads } = await setup({ reward: false });
    expect(await ads.watchRewardedAd()).toBe(false);
  });

  it('asks for consent where required and then offers the privacy settings', async () => {
    const { AdMob, ads } = await setup({ consent: 'REQUIRED' });
    expect(await ads.watchRewardedAd()).toBe(true);
    expect(AdMob.showConsentForm).toHaveBeenCalledTimes(1);
    expect(ads.needsPrivacyOptions()).toBe(true);
  });

  it("fails with a Hebrew message when no ad loads, and marks Google's sample unit as a test", async () => {
    const { AdMob, ads } = await setup({ id: 'ca-app-pub-3940256099942544/5224354917' });
    AdMob.prepareRewardVideoAd.mockRejectedValueOnce(new Error('No fill'));
    await expect(ads.watchRewardedAd()).rejects.toThrow(ads.AD_UNAVAILABLE_MESSAGE);
    expect(AdMob.prepareRewardVideoAd).toHaveBeenCalledWith(expect.objectContaining({ isTesting: true }));
  });
});
