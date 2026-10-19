import { PERSONAS, type Persona } from '../../../shared/call';
import { canListen } from '../../lib/listen';
import { personaStyle } from './persona-style';

interface Props {
  onCall: (persona: Persona) => void;
}

/** The "call" tab: pick an AI character to talk to. */
export function CallPicker({ onCall }: Props) {
  return (
    <div className="call-picker">
      <h2>📞 שיחת וידאו באנגלית</h2>
      <p className="muted">בחרו דמות, התקשרו ודברו איתה באנגלית – כמו בשיחה אמיתית.</p>

      <p className="call-notice" role="note">
        <span aria-hidden="true">🤖</span>
        <span>הדמויות הן בינה מלאכותית, לא אנשים אמיתיים. אל תשתפו פרטים אישיים.</span>
      </p>

      {!canListen && (
        <p className="call-notice warn" role="note">
          <span aria-hidden="true">🎤</span>
          <span>כדי לדבר בקול צריך את האפליקציה או דפדפן Chrome. כאן אפשר לנהל את השיחה בהקלדה.</span>
        </p>
      )}

      <ul className="persona-grid">
        {PERSONAS.map((p) => (
          <li key={p.id} className="persona-card" style={personaStyle(p.color)}>
            <span className="persona-avatar" aria-hidden="true">
              {p.emoji}
            </span>
            <div className="persona-info">
              <h3>
                <span dir="ltr">{p.name}</span> <span className="persona-role">· {p.roleHe}</span>
              </h3>
              <p>{p.descriptionHe}</p>
            </div>
            <button
              type="button"
              className="btn primary small persona-call"
              onClick={() => onCall(p)}
              aria-label={`התקשרו ל${p.name}, ${p.roleHe}`}
            >
              התקשרו 📞
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
