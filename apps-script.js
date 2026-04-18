const SHEET_ID = '1UZdBLmVummTCPhKHusVQBnjdd_nPGcj6pZ9Z54KywMU';
const SHEET_NAME = '點餐紀錄';
const HEADERS = ['日期', '時間', '餐廳', '日文菜名', '中文菜名', '單價(¥)', '數量', '小計(¥)', '本餐合計(¥)'];

// GET + query string 方案（避免 POST→302→GET body 遺失問題）
function doGet(e) {
  const props = PropertiesService.getScriptProperties();

  // 有 payload 參數 = 這是記帳請求（前端改用 GET 發送）
  if (e.parameter.payload) {
    props.setProperty('lastPostTime', new Date().toISOString());
    try {
      const data = JSON.parse(e.parameter.payload);
      props.setProperty('lastPostPayloadType', 'GET-payload / items=' + (data.items ? data.items.length : 0));
      props.setProperty('lastPostFirstLocal', data.items && data.items[0] ? String(data.items[0].local) : '(empty)');

      const ss = SpreadsheetApp.openById(SHEET_ID);
      let sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        sheet.appendRow(HEADERS);
        sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }

      data.items.forEach((item, index) => {
        sheet.appendRow([
          data.date, data.time, data.restaurant,
          item.local, item.zh, item.price, item.quantity, item.subtotal,
          index === 0 ? data.total : ''
        ]);
      });

      props.setProperty('lastPostStatus', 'SUCCESS count=' + data.items.length);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);

    } catch (err) {
      props.setProperty('lastPostStatus', 'ERROR: ' + err.message);
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 無 payload = debug 查詢
  props.setProperty('lastGetTime', new Date().toISOString());
  const debug = {
    version: 'v8-get',
    lastPostTime:        props.getProperty('lastPostTime')        || 'never',
    lastPostStatus:      props.getProperty('lastPostStatus')      || 'none',
    lastPostPayloadType: props.getProperty('lastPostPayloadType') || 'none',
    lastPostFirstLocal:  props.getProperty('lastPostFirstLocal')  || 'none',
    lastGetTime:         props.getProperty('lastGetTime'),
  };
  return ContentService
    .createTextOutput(JSON.stringify(debug, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// doPost 保留但不再依賴（POST 會被 redirect 成 GET）
function doPost(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ info: 'use GET instead' }))
    .setMimeType(ContentService.MimeType.JSON);
}
