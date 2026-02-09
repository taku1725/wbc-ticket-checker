const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 出品一覧ページへ移動
    await page.goto('https://tradead.tixplus.jp/wbc2026/buy/bidding', { 
      waitUntil: 'networkidle' 
    });

    // 試合ごとのブロックをすべて取得して解析
    const matches = await page.evaluate(() => {
      // リンク（aタグ）が各試合のカードになっている
      const cards = Array.from(document.querySelectorAll('a[href*="/listings/"]'));
      
      return cards.map(card => {
        const date = card.querySelector('h4')?.innerText.trim() || "";
        const time = card.querySelector('h6.MuiTypography-subtitle1.css-gg6ejd')?.innerText.trim() || "";
        const countText = card.querySelector('h5')?.innerText.trim() || "0件";
        const link = card.href;

        return { date, time, countText, link };
      });
    });

    console.log(`--- チェック完了 (${new Date().toLocaleString('ja-JP')}) ---`);

    let anyHit = false;
    matches.forEach(m => {
      // 取得した情報を表示
      console.log(`【${m.date}日 ${m.time}】 出品: ${m.countText}`);
      
      // 「0件」以外があれば通知フラグ
      if (m.countText !== '0件' && m.countText.includes('件')) {
        console.log(`  ★発見！ URL: ${m.link}`);
        anyHit = true;
      }
    });

    if (!anyHit) {
      console.log('現在、出品中のチケットはありません。');
    }

  } catch (error) {
    console.error('エラー:', error);
  }

  await browser.close();
})();