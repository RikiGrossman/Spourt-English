import { useState } from 'react';
import { AD_UNAVAILABLE_MESSAGE } from '../lib/ads';

interface Props {
  /** The button's text, e.g. "צפו בסרטון קצר וקבלו לב". */
  label: string;
  /** Shows the video and gives the reward; resolves whether it was watched through. */
  onWatch: () => Promise<boolean>;
  className?: string;
}

/** "Watch a short video for a reward": the learner always chooses to see a rewarded ad. */
export function RewardedAdButton({ label, onWatch, className = 'btn secondary' }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function watch() {
    setLoading(true);
    setMessage('');
    try {
      if (!(await onWatch())) setMessage('הסרטון נסגר לפני הסוף, אז הפרס לא התקבל.');
    } catch (err) {
      setMessage(err instanceof Error && err.message ? err.message : AD_UNAVAILABLE_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => void watch()} disabled={loading}>
        🎬 {loading ? 'טוען סרטון…' : label}
      </button>
      {message && (
        <p className="muted" role="status">
          {message}
        </p>
      )}
    </>
  );
}
