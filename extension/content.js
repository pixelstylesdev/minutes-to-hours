console.log('let\'s get it.');

// List of columns with time data that may contain minutes
// e.g. 5h 30m
const COLS_WITH_MINUTES = [
  'Hours',
  'Day',
  'Week',
  'Pay Period'
];

const table = document.querySelector('.TimeClockTable:not(.Filter)'); // we don't care about the table filter
const tableHeaders = Array.from(table.querySelectorAll('th'));

// Only modify the cells in each row that have time values
let colsWithMinutesIdxs = [];
tableHeaders.forEach((th, idx) => {
  if (COLS_WITH_MINUTES.indexOf(th.innerHTML) > -1) {
    // (idx + 1) is a hacky way to deal with the 'Date' column having two <td>s.
    // Without it filterCellsWithMinutes() is off by one column since the number
    // of <td>s don't match the number of <th>'s.
    colsWithMinutesIdxs.push(idx + 1);
  }
});

/**
 * Filter out any non-time data cells (e.g. employee name, data, etc.).
 * List of time-related cells may be found in COLS_WITH_MINUTES.
 * Should help with performance as it prevents us from processing
 * unnecessary cells.
 * 
 * @param {node} cell The cell with time data
 * @param {number} idx The index of the cell in the array
 */
const filterCellsWithMinutes = (cell, idx) => {
  return colsWithMinutesIdxs.indexOf(idx) > -1;
};

const mainTableBody = table.querySelector('tbody');
const rows = Array.from(mainTableBody.children);
let cellsWithTime = [];
rows.forEach(row => {
  const cells = Array.from(row.children).filter(filterCellsWithMinutes);
  cellsWithTime = [...cellsWithTime, ...cells];
});

const minsToHrs = m => m/60;

/**
 * Converts the minutes to hours and combines that with any
 * existing hours provided. Renders this final value as an
 * HTML string in the following format:
 * 
 * <b>12.05</b>h
 * 
 * @param {number} hrs The hours
 * @param {number} mins The minutes
 * @returns {string} The rendered HTML string
 */
const renderHours = (hrs, mins) => {
  const totalHrs = (hrs + minsToHrs(mins)).toFixed(2);
  return `<b>${totalHrs}</b>h`;
};

/**
 * Render the minutes to hours in the table. We save the
 * original content in a separate div so we can show/hide
 * it if the user opts to enable/disable the extension via
 * our popup.html.
 * 
 * @param {node} cell The <td> to modify
 * @param {number} hrs The hours
 * @param {number} mins The minutes
 */
const renderCell = (cell, hrs, mins) => {
  const originalContent = cell.innerHTML;
  const newContent = renderHours(hrs, mins); 
  
  cell.innerHTML = '';

  const divOld = document.createElement('div');
  divOld.setAttribute('mth-original', true);
  divOld.style.display = 'none';
  divOld.innerHTML = originalContent;

  const divNew = document.createElement('div');
  divNew.setAttribute('mth-updated', true);
  divNew.innerHTML = newContent;

  cell.appendChild(divOld);
  cell.appendChild(divNew);
};

/**
 * Show/hide the updated hours or the original content of the cell.
 * 
 * @param {node} cell         The cell to update
 * @param {boolean} showHours If true, show the updated values, else show original
 */
const toggleContent = (cell, showHours) => {
  const toShow = showHours ? 'mth-updated' : 'mth-original';
  const toHide = showHours ? 'mth-original' : 'mth-updated';

  cell.querySelector(`div[${toShow}]`).style.display = 'block';
  cell.querySelector(`div[${toHide}]`).style.display = 'none';
};

const updateCells = (extensionEnabled) => {
  cellsWithTime.forEach(cell => {
    /**
     * Expects duration formatted as follows:
     * 
     * <td class="R" title="Work Regular Rate">
     *   <b>5</b>h&nbsp;&nbsp;&nbsp;<b>9</b>m
     * </td>
     */
    const durationCells = Array.from(cell.querySelectorAll('.R'));
    durationCells.forEach(dCell => {
      const duration = Array.from(dCell.querySelectorAll('b'));
      if (duration.length) { // ignore the empty cells
        if (dCell.querySelector('div[mth-updated]')) {
          // has already been processed, so just show/hide
          toggleContent(dCell, extensionEnabled);
        } else if (extensionEnabled) {
          // has not been processed, so prep everything
          const hrs = parseInt(duration[0].innerHTML, 10);
          const mins = parseInt(duration[1].innerHTML, 10);
          renderCell(dCell, hrs, mins);
        }
      }
    })
  });
};

chrome.storage.local.get('enabled', store => {
  updateCells(store.enabled);
});

// Listen for toggle on/off from extension popup.
// Allows us to show/hide the change from minutes to hours
chrome.runtime.onMessage.addListener((req, sender) => {
  if (typeof req === 'object' && req.action === 'TOGGLE_ENABLED') {
    updateCells(req.enabled);
  }
});
