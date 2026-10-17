interface Props {
  ready: boolean;
  onCheck: () => void;
}

/** Bottom bar with the "check" button, shown while an answer is being composed. */
export function CheckFooter({ ready, onCheck }: Props) {
  return (
    <footer className="lesson-footer">
      <button type="button" className="btn primary" disabled={!ready} onClick={onCheck}>
        בדיקה
      </button>
    </footer>
  );
}
