const fs = require('fs');
let c = fs.readFileSync('src/components/MeetingScheduler.tsx', 'utf8');

if (!c.includes("import DatePicker")) {
   c = c.replace(
      "import type { Customer } from '../domain/types';",
      "import type { Customer } from '../domain/types';\nimport DatePicker, { registerLocale } from 'react-datepicker';\nimport { vi } from 'date-fns/locale/vi';\nregisterLocale('vi', vi);"
   );
}

// State string date -> Date object for DatePicker
c = c.replace("const [date, setDate] = useState('');", "const [date, setDate] = useState<Date | null>(null);");

// `quick` function using DatePicker state
c = c.replace(
`  const quick = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    setDate(toLocalInput(d));
  };`,
`  const quick = (daysAhead: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    setDate(d);
  };`
);

// `add` function fixing the date string payload
c = c.replace(
`    if (!date) return;
    const label = typeOf(type).label;
    const m = { id: Date.now().toString(), date, note: note.trim() || label, type };`,
`    if (!date) return;
    const label = typeOf(type).label;
    const isoDate = toLocalInput(date); // or date.toISOString() - fallback to LocalInput equivalent so countdowns work the same
    const m = { id: Date.now().toString(), date: isoDate, note: note.trim() || label, type };`
);

// Change the input
const oldInput = `<input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className="input text-sm sm:w-56" />`;
const newInput = `<DatePicker
              selected={date}
              onChange={(d: Date | null) => setDate(d)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Giờ"
              dateFormat="dd/MM/yyyy HH:mm"
              locale="vi"
              placeholderText="Chọn ngày giờ..."
              className="input text-sm sm:w-[220px]"
              required
            />`;
c = c.replace(oldInput, newInput);

fs.writeFileSync('src/components/MeetingScheduler.tsx', c, 'utf8');
