const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');

const importStatement = "@import 'react-datepicker/dist/react-datepicker.css';\n";
if (!css.includes('react-datepicker.css')) {
   css = importStatement + css;
}

const customOverrides = `
/* Tùy chỉnh DatePicker sang màu cam thương hiệu */
.react-datepicker-wrapper { width: 100%; }
.react-datepicker {
  @apply border border-orange-100 bg-white shadow-xl shadow-orange-500/10 font-sans rounded-xl dark:bg-slate-900 dark:border-slate-700;
}
.react-datepicker__header {
  @apply bg-orange-50/80 border-b border-orange-100 dark:bg-slate-800 dark:border-slate-700 rounded-t-xl pt-3;
}
.react-datepicker__current-month, .react-datepicker-time__header, .react-datepicker-year-header {
  @apply text-orange-800 dark:text-orange-300 font-bold text-sm;
}
.react-datepicker__day-name {
  @apply text-orange-600/70 dark:text-orange-400/70 font-semibold w-8;
}
.react-datepicker__day {
  @apply text-slate-700 dark:text-slate-200 w-8 rounded-lg hover:bg-orange-100 dark:hover:bg-slate-700 transition-colors;
}
.react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range, .react-datepicker__month-text--selected, .react-datepicker__quarter-text--selected, .react-datepicker__year-text--selected {
  @apply bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:bg-orange-600 hover:text-white rounded-lg font-bold;
}
.react-datepicker__day--keyboard-selected {
  @apply bg-orange-200 text-orange-800 dark:bg-slate-700 dark:text-orange-300 rounded-lg;
}
.react-datepicker__time-container {
  @apply border-l border-orange-100 dark:border-slate-700 w-24;
}
.react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item {
  @apply h-auto py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-slate-700 transition-colors;
}
.react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
  @apply bg-orange-500 text-white font-bold;
}
.react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::before, .react-datepicker-popper[data-placement^=bottom] .react-datepicker__triangle::after {
  @apply border-b-white dark:border-b-slate-900;
}
`;

if (!css.includes('.react-datepicker-wrapper')) {
   css += '\n' + customOverrides;
}

fs.writeFileSync('src/index.css', css, 'utf8');
