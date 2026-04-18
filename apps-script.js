const SHEET_ID = '1UZdBLmVummTCPhKHusVQBnjdd_nPGcj6pZ9Z54KywMU';
const SHEET_NAME = '點餐紀錄';
const HEADERS = ['日期', '時間', '餐廳', '日文菜名', '中文菜名', '單價(¥)', '數量', '小計(¥)', '本餐合計(¥)'];

function doPost(e) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('lastPostTime', new Date().toISOString());

  try {
    const payload = e.parameter.payload;
    props.setProperty('lastPostPayloadType', typeof payload + ' / ' + String(payload).substring(0, 100));

    const data = JSON.parse(payload);
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

// 每次被呼叫都記錄（無論有無 payload），用來偵測 POST→GET redirect
function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('lastGetTime', new Date().toISOString());
  props.setProperty('lastGetParams', JSON.stringify(e.parameter));

  // 查看 debug 資訊
  const debug = {
    version: 'v7',
    lastPostTime:  props.getProperty('lastPostTime')  || 'never',
    lastPostStatus: props.getProperty('lastPostStatus') || 'none',
    lastPostPayloadType: props.getProperty('lastPostPayloadType') || 'none',
    lastPostFirstLocal:  props.getProperty('lastPostFirstLocal')  || 'none',
    lastGetTime:   props.getProperty('lastGetTime'),
    lastGetParams: props.getProperty('lastGetParams'),
  };
  return ContentService
    .createTextOutput(JSON.stringify(debug, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}
