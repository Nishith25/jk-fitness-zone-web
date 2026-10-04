export default function AppLogo({
  compact = false,
}) {
  return (
    <div className={compact ? 'jk-brand compact' : 'jk-brand'}>
      <img
        src="/jk-logo.png"
        alt="JK Fitness Zone"
        className="jk-brand-logo"
      />

      <div className="jk-brand-copy">
        <strong>JK FITNESS ZONE</strong>
        <span>MANAGEMENT PORTAL</span>
      </div>
    </div>
  )
}
