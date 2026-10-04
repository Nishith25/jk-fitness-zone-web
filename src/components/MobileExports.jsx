export default function MobileExports({
  onPDF,
  onExcel,
  onCSV,
}) {
  return (
    <section className="mobile-export-box">

      <div>
        <span>REPORTS</span>
        <strong>Export monthly data</strong>
      </div>

      <div className="mobile-export-actions">

        <button onClick={onPDF}>
          PDF
        </button>

        <button onClick={onExcel}>
          Excel
        </button>

        <button onClick={onCSV}>
          CSV
        </button>

      </div>

    </section>
  )
}
