
export function InputBox({ label, placeholder, onChange, type = "text", value }) {
  return <div>
    <div className="text-sm font-medium text-left py-2">
      {label}
    </div>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-2 py-1 border rounded border-slate-200"
    />
  </div>
}