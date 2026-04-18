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

function doPost(e) {
  try {
    // 前端用 URLSearchParams 送，Apps Script 用 e.parameter 讀（不是 e.postData.contents）
    const data = JSON.parse(e.parameter.payload);

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
        data.date,
        data.time,
        data.restaurant,
        item.local,   // 原文菜名（日文/韓文/泰文等）
        item.zh,
        item.price,
        item.quantity,
        item.subtotal,
        index === 0 ? data.total : ''
      ]);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, count: data.items.length }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 瀏覽器開 URL 時確認版本
function doGet(e) {
  return ContentService.createTextOutput('旅遊點餐助手 v6 ✅').setMimeType(ContentService.MimeType.TEXT);
}
