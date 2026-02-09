const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('https://tradead.tixplus.jp/wbc2026/buy/bidding', { 
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // --- 対策1: 特定の要素（h5など）が表示されるまで最大10秒待つ ---
    try {
      await page.waitForSelector('h5', { timeout: 10000 });
    } catch (e) {
      console.log('要素の読み込みに時間がかかっています...');
    }

    // --- 対策2: 念のため数秒間追加で待機（描画待ち） ---
    await page.waitForTimeout(3000); 

    const matches = await page.evaluate(() => {
      // --- 対策3: セレクタを少し広めに設定（MuiTypography-h5も含める） ---
      const cards = Array.from(document.querySelectorAll('a[href*="/listings/"]'));
      
      return cards.map(card => {
        const date = card.querySelector('h4')?.innerText.trim() || "不明";
        // クラス名が変動している可能性があるので、h6全般から取得
        const time = card.querySelector('h6')?.innerText.trim() || "";
        const countText = card.querySelector('h5')?.innerText.trim() || "0件";
        const link = card.href;

        return { date, time, countText, link };
      });
    });

    console.log(`--- チェック完了 (${new Date().toLocaleString('ja-JP')}) ---`);

    // デバッグ用：取得したカードの総数を表示
    console.log(`取得した試合数: ${matches.length}`);

    let anyHit = false;
    matches.forEach(m => {
      console.log(`【${m.date}日 ${m.time}】 出品: ${m.countText}`);
      
      // 「0件」という文字が含まれていない、かつ「件」という文字がある場合
      if (m.countText !== '0件' && m.countText.includes('件')) {
        console.log(`  ★発見！ URL: ${m.link}`);
        anyHit = true;
      }
    });

    if (!anyHit && matches.length === 0) {
      console.log('警告: 試合データ自体が1件も取得できていません。セレクタが変更された可能性があります。');
    } else if (!anyHit) {
      console.log('現在、出品中のチケットはありません。');
    }

  } catch (error) {
    console.error('エラー:', error);
  }

  await browser.close();
})();