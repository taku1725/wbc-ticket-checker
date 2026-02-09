const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. ページ移動（タイムアウトを長めに設定）
    await page.goto('https://tradead.tixplus.jp/wbc2026/buy/bidding', { 
      waitUntil: 'networkidle', 
      timeout: 60000 
    });

    // 2. 「件」という文字が出るまで最大20秒待つ（これが重要！）
    console.log('データの読み込みを待機中...');
    await page.waitForSelector('text="件"', { timeout: 20000 }).catch(() => {
      console.log('「件」という文字が見つかりませんでしたが、続行します。');
    });

    // 3.念のため追加で3秒待機（描画を安定させる）
    await page.waitForTimeout(3000);

    // 4. データの抽出
    const matches = await page.evaluate(() => {
      const results = [];
      // すべての <a> タグの中から、内部に件数表示(h5)を持つものを探す
      const cards = Array.from(document.querySelectorAll('a'));

      cards.forEach(card => {
        const h5 = card.querySelector('h5');
        if (h5 && h5.innerText.includes('件')) {
          const date = card.querySelector('h4')?.innerText.trim() || "";
          const h6s = Array.from(card.querySelectorAll('h6'));
          // 時間(00:00形式)が含まれるh6を探す
          const time = h6s.find(h => h.innerText.includes(':'))?.innerText.trim() || "";
          const countText = h5.innerText.trim();
          const link = card.href;

          results.push({ date, time, countText, link });
        }
      });
      return results;
    });

    console.log(`--- チェック完了 (${new Date().toLocaleString('ja-JP')}) ---`);
    console.log(`取得した試合数: ${matches.length}`);

    let anyHit = false;
    matches.forEach(m => {
      console.log(`【${m.date}日 ${m.time}】 出品: ${m.countText}`);
      
      // 「0件」以外の数字が入っていればヒット
      const countNum = parseInt(m.countText.replace(/[^0-9]/g, ''));
      if (countNum > 0) {
        console.log(`  ★出品中！ URL: ${m.link}`);
        anyHit = true;
      }
    });

    if (matches.length === 0) {
      console.log('警告: 試合データが取得できませんでした。');
      // 予備：ページ全体のテキストを少し出す
      const text = await page.innerText('body');
      console.log('ページ冒頭テキスト:', text.substring(0, 100));
    }

  } catch (error) {
    console.error('エラー発生:', error);
  }

  await browser.close();
})();