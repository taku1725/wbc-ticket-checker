const { chromium } = require('playwright');

(async () => {
  // 対策1: headlessをfalseにする（GitHub Actions上ではこれでも動くよう設定済み）
  // 対策2: 言語設定やプラットフォームを偽装する
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  });

  const page = await context.newPage();

  try {
    // 対策3: JavaScriptがボットを検知する仕組みを一部無効化
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    console.log('サイトにアクセス中...');
    const response = await page.goto('https://tradead.tixplus.jp/wbc2026/buy/bidding', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });

    // ステータスコードの確認
    console.log('HTTPステータス:', response.status());

    if (response.status() === 403) {
      console.log('まだブロックされています。User-Agentを変更するか、別の対策が必要です。');
    }

    // 読み込み待ち
    await page.waitForTimeout(7000); 

    const matches = await page.evaluate(() => {
      const results = [];
      const cards = Array.from(document.querySelectorAll('a'));
      cards.forEach(card => {
        const h5 = card.querySelector('h5');
        if (h5 && h5.innerText.includes('件')) {
          const date = card.querySelector('h4')?.innerText.trim() || "";
          const h6s = Array.from(card.querySelectorAll('h6'));
          const time = h6s.find(h => h.innerText.includes(':'))?.innerText.trim() || "";
          const countText = h5.innerText.trim();
          results.push({ date, time, countText, link: card.href });
        }
      });
      return results;
    });

    console.log(`--- チェック完了 (${new Date().toLocaleString('ja-JP')}) ---`);
    console.log(`取得した試合数: ${matches.length}`);

    matches.forEach(m => {
      console.log(`【${m.date}日 ${m.time}】 出品: ${m.countText}`);
    });

  } catch (error) {
    console.error('エラー発生:', error);
  }

  await browser.close();
})();