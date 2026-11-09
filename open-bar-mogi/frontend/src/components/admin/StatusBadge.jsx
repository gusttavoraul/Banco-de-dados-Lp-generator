import { STATUS } from "../../lib/quotes"

function StatusBadge({ status, large = false }) {
  const info = STATUS[status] ?? { label: status, className: "text-zinc-400 border-zinc-700" }
  return (
    <span
      className={`inline-block rounded-full border whitespace-nowrap ${
        large ? "px-4 py-2" : "px-3 py-1 text-sm"
      } ${info.className}`}
    >
      {info.label}
    </span>
  )
}

export default StatusBadge
