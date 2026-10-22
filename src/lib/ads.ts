import { isPlayBuild } from './update';

/**
 * Rewarded video ads in the Google Play edition of the app, through AdMob
 * (@capacitor-community/admob, docs/ads.md). The learner always chooses to watch: a video refills a
 * heart when they run out, or doubles the daily chest. There are no banners or ads that open by
 * themselves, and premium members see none.
 *
 * Ads are offered only in the Play build, with VITE_ADMOB_REWARDED_ID (the rewarded ad unit id) set
 * at build time; the AdMob app id goes into the Android manifest (ADMOB_APP_ID, android/app/build.gradle).
 * Before the first ad, Google's consent message (UMP) asks learners in the EEA, the UK and
 * Switzerland about personalized ads; elsewhere it doesn't show.
 */

export const ADMOB_REWARDED_ID: string = import.meta.env.VITE_ADMOB_REWARDED_ID ?? '';

/** Google's sample rewarded unit: always serves test ads, so it is safe on any device. */
export const TEST_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';

export const AD_UNAVAILABLE_MESSAGE = 'אין כרגע סרטון זמין. נסו שוב בעוד כמה דקות.';

type AdMobModule = typeof import('@capacitor-community/admob');

let support: Promise<boolean> | undefined;
let sdk: Promise<AdMobModule> | undefined;
/** initialize and the consent check (they run once, before the first ad). */
let ready: Promise<boolean> | undefined;
/** Whether Google's consent message asks for a "privacy settings" entry point (EEA learners). */
let privacyOptions = false;

/** Whether this build shows rewarded ads (the Play build with an ad unit id). */
export function adsSupported(): Promise<boolean> {
  support ??= ADMOB_REWARDED_ID ? isPlayBuild() : Promise.resolve(false);
  return support;
}

function load(): Promise<AdMobModule> {
  sdk ??= import('@capacitor-community/admob');
  return sdk;
}

/**
 * Starts the SDK and asks for consent where the law requires it. Resolves whether ads may be
 * requested; a failure (offline) is retried on the next ad.
 */
function prepare(): Promise<boolean> {
  ready ??= (async () => {
    const { AdMob, AdmobConsentStatus, MaxAdContentRating } = await load();
    let info = await AdMob.requestConsentInfo();
    if (info.status === AdmobConsentStatus.REQUIRED && info.isConsentFormAvailable) {
      info = await AdMob.showConsentForm();
    }
    privacyOptions = String(info.privacyOptionsRequirementStatus) === 'REQUIRED';
    if (!info.canRequestAds) return false;
    // The app is for ages 13 and up (docs/store-release.md); keep ads suitable for teens.
    await AdMob.initialize({ maxAdContentRating: MaxAdContentRating.Teen });
    return true;
  })().catch(() => false);
  void ready.then((ok) => {
    if (!ok) ready = undefined;
  });
  return ready;
}

/**
 * Loads and shows a rewarded video. Resolves true once the learner watched it through and closed
 * it, false when they closed it early. Throws Error(AD_UNAVAILABLE_MESSAGE) when no ad could be
 * shown (offline, no fill, no consent).
 */
export async function watchRewardedAd(): Promise<boolean> {
  if (!(await adsSupported()) || !(await prepare())) throw new Error(AD_UNAVAILABLE_MESSAGE);
  const { AdMob, RewardAdPluginEvents } = await load();
  try {
    await AdMob.prepareRewardVideoAd({ adId: ADMOB_REWARDED_ID, isTesting: ADMOB_REWARDED_ID === TEST_REWARDED_ID });
  } catch {
    throw new Error(AD_UNAVAILABLE_MESSAGE);
  }
  // showRewardVideoAd resolves only when the reward is earned, so closing early is heard from the
  // Dismissed event. The reward is handed over when the video closes, back in the app.
  let earned = false;
  let closed!: (earned: boolean) => void;
  let failed!: () => void;
  const result = new Promise<boolean>((resolve, reject) => {
    closed = resolve;
    failed = () => reject(new Error(AD_UNAVAILABLE_MESSAGE));
  });
  const handles = await Promise.all([
    AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      earned = true;
    }),
    AdMob.addListener(RewardAdPluginEvents.Dismissed, () => closed(earned)),
    AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => failed()),
  ]);
  try {
    AdMob.showRewardVideoAd().catch(() => failed());
    return await result;
  } finally {
    for (const handle of handles) void handle.remove();
  }
}

/** Whether to offer "privacy settings for ads" (learners whom the consent message applies to). */
export function needsPrivacyOptions(): boolean {
  return privacyOptions;
}

/** Opens Google's form for changing the ads consent. */
export async function showAdPrivacyOptions(): Promise<void> {
  const { AdMob } = await load();
  await AdMob.showPrivacyOptionsForm();
}
