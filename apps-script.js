/**
 * 旅遊點餐助手 - Google Apps Script
 *
 * 設定步驟：
 * 1. 開啟試算表：https://docs.google.com/spreadsheets/d/1UZdBLmVummTCPhKHusVQBnjdd_nPGcj6pZ9Z54KywMU
 * 2. 上方選單 → 擴充功能 → Apps Script
 * 3. 把這整個檔案的內容貼到編輯器（取代原有內容）
 * 4. 按「部署」→「新增部署作業」
 * 5. 類型選「網頁應用程式」
 * 6. 執行身分：「我」；存取權：「任何人」
 * 7. 按「部署」→ 複製「網頁應用程式網址」
 * 8. 把該網址貼到 index.html App 的設定中
 */

const SHEET_ID = '1UZdBLmVummTCPhKHusVQBnjdd_nPGcj6pZ9Z54KywMU';
const SHEET_NAME = '點餐紀錄';
const HEADERS = ['日期', '時間', '餐廳', '日文菜名', '中文菜名', '單價(¥)', '數量', '小計(¥)', '本餐合計(¥)'];

function writeToSheet_(data) {
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
  return data.items.length;
}

// 主要記帳入口：前端用 GET + ?payload=... 送過來
// （POST 會被 Apps Script 302 redirect 轉成 GET 並丟掉 body，所以改用 GET）
function doGet(e) {
  const props = PropertiesService.getScriptProperties();

  if (e.parameter && e.parameter.payload) {
    props.setProperty('lastTime', new Date().toISOString());
    try {
      const data = JSON.parse(e.parameter.payload);
      const count = writeToSheet_(data);
      const firstLocal = data.items && data.items[0] ? data.items[0].local : '?';
      props.setProperty('lastStatus', 'OK, count=' + count + ', first.local=' + firstLocal);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, count: count }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      props.setProperty('lastStatus', 'ERROR: ' + err.message);
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // 無 payload → 回傳 debug 資訊
  return ContentService
    .createTextOutput(JSON.stringify({
      version: 'v5-get',
      lastTime: props.getProperty('lastTime') || 'never',
      lastStatus: props.getProperty('lastStatus') || 'none',
    }, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// 保留 doPost 以防萬一，邏輯與 doGet 相同
function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('lastTime', new Date().toISOString());
  try {
    const raw = (e && e.parameter && e.parameter.payload)
      || (e && e.postData && e.postData.contents)
      || '';
    if (!raw) throw new Error('payload empty');
    const data = JSON.parse(raw);
    const count = writeToSheet_(data);
    props.setProperty('lastStatus', 'OK(POST), count=' + count);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, count: count }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    props.setProperty('lastStatus', 'ERROR(POST): ' + err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
