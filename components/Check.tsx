export default function Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" className="check" aria-pressed={on} aria-label={label} onClick={onClick}>
      <span>
        {on && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M2 6.5l2.5 2.5L10 3.5" />
          </svg>
        )}
      </span>
    </button>
  )
}
