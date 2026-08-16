function getSpreadsheet_() { return SpreadsheetApp.openById(getRequiredProperty_('PRIMARY_SPREADSHEET_ID')); }

function ensureSheets_() {
  const ss = getSpreadsheet_();
  Object.keys(HEADERS).forEach(function (name) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS[name].length).setValues([HEADERS[name]]).setFontWeight('bold').setBackground('#17324d').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  });
}

function sheetRows_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1).filter(function (row) { return row.some(function (v) { return v !== ''; }); }).map(function (row, index) {
    const item = { _row: index + 2 };
    headers.forEach(function (h, i) { item[h] = row[i]; });
    return item;
  });
}

function appendRow_(name, item) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  const headers = HEADERS[name];
  sheet.appendRow(headers.map(function (h) { return item[h] === undefined ? '' : item[h]; }));
  return item;
}

function updateRow_(name, rowNumber, changes) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  const headers = HEADERS[name];
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  headers.forEach(function (h, i) { if (Object.prototype.hasOwnProperty.call(changes, h)) current[i] = changes[h]; });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([current]);
}

function findById_(name, id) { return sheetRows_(name).find(function (x) { return String(x.id) === String(id); }); }

function audit_(actor, action, entity, entityId, detail) {
  appendRow_(APP.SHEETS.AUDIT, { id: uuid_(), actor: normalizeEmail_(actor) || 'system', action: action, entity: entity, entityId: entityId, detail: JSON.stringify(detail || {}).slice(0, 2000), createdAt: nowIso_() });
}
