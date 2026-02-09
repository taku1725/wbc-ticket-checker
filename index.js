const { chromium } = require('playwright');

(async () => {
  // ブラウザを起動
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // WBCのページへ移動（読み込みが終わるまで待機）
    await page.goto('https://tradead.tixplus.jp/wbc2026', { waitUntil: 'networkidle' });

    // 「トレード出品一覧」の各アイテムを探して情報を抜く
    const results = await page.$$eval('.trade_list_item', items => {
      return items.map(item => {
        const title = item.querySelector('.title')?.innerText.trim() || '試合名不明';
        const count = item.querySelector('.count')?.innerText.trim() || '0枚';
        return { title, count };
      });
    });

    console.log(`--- チェック完了 (${new Date().toLocaleString('ja-JP')}) ---`);
    
    let hit = false;
    results.forEach(res => {
      console.log(`${res.title}: ${res.count}`);
      // 「0枚」以外の文字が含まれていたらフラグを立てる
      if (!res.count.includes('0枚')) {
        hit = true;
      }
    });

    if (hit) {
      console.log('★出品を見つけました！');
      // ここに通知処理を追加できます
    }

  } catch (error) {
    console.error('エラーが起きました:', error);
  }

  await browser.close();
})();