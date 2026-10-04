export default function MobileBottomNav({
  active,
  onChange,
}) {
  const items = [
    ['dashboard', 'Home'],
    ['members', 'Members'],
    ['trainers', 'Trainers'],
    ['settlements', 'Payments'],
    ['activity', 'Activity'],
  ]

  return (
    <nav className="mobile-bottom-nav">
      {items.map(([id, label]) => (
        <button
          key={id}
          className={
            active === id
              ? 'mobile-bottom-item active'
              : 'mobile-bottom-item'
          }
          onClick={() => onChange(id)}
        >
          {label}
        </button>
      ))}
    </nav>
  )
}
