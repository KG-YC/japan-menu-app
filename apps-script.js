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

// 表頭（第一次執行時自動建立）
const HEADERS = ['日期', '時間', '餐廳', '日文菜名', '中文菜名', '單價(¥)', '數量', '小計(¥)', '本餐合計(¥)'];

function doPost(e) {
  try {
    const data = JSON.parse(e.parameter.payload);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);

    // 第一次自動建立工作表與表頭
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // 寫入每個品項（合計只顯示在第一行）
    data.items.forEach((item, index) => {
      sheet.appendRow([
        data.date,
        data.time,
        data.restaurant,
        item.local,
        item.zh,
        item.price,
        item.quantity,
        item.subtotal,
        index === 0 ? data.total : ''  // 本餐合計只寫第一行
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

// 測試用（瀏覽器直接開 URL 時回傳 OK）
function doGet(e) {
  return ContentService.createTextOutput('旅遊點餐助手 API OK ✅');
}
