import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { URL } from 'url';

interface CrawledPage {
  url: string;
  title: string;
  content: string;
}

export async function crawlWebsite(
  startUrl: string, 
  maxPages: number = 15,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<CrawledPage[]> {
  const baseUrl = new URL(startUrl);
  const domain = baseUrl.hostname;
  
  const queue: string[] = [startUrl];
  const visited = new Set<string>();
  const results: CrawledPage[] = [];

  console.log(`[Crawler] Initializing Browser for domain: ${domain}`);
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    while (queue.length > 0 && visited.size < maxPages) {
      const currentUrl = queue.shift();
      if (!currentUrl || visited.has(currentUrl)) continue;

      visited.add(currentUrl);
      onProgress?.(`Crawling`, visited.size, maxPages);

      console.log(`[Crawler] Fetching (${visited.size}/${maxPages}): ${currentUrl}`);
      
      const page = await browser.newPage();
      try {
        // Standard optimized configurations for fast content fetching
        await page.setRequestInterception(true);
        page.on('request', (req) => {
          const resType = req.resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resType)) {
            req.abort();
          } else {
            req.continue();
          }
        });

        await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait for raw body visibility just in case it's a slow SPA
        await page.waitForSelector('body', { timeout: 5000 }).catch(() => {});
        
        const html = await page.content();
        const $ = cheerio.load(html);

        // Strip out noise elements that pollute RAG contexts
        $('script, style, nav, header, footer, iframe, noscript, svg, form').remove();

        const title = $('title').text().trim() || currentUrl;
        
        // Basic content cleanup - preserves standard block elements formatting roughly
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

        if (bodyText.length > 200) {
          results.push({
            url: currentUrl,
            title,
            content: bodyText
          });
        }

        // Discover Internal Links
        $('a[href]').each((_, element) => {
          try {
            const href = $(element).attr('href');
            if (!href) return;

            const absoluteUrl = new URL(href, currentUrl);
            absoluteUrl.hash = ''; // Ignore anchors

            // Only crawl internal links and ignore known binaries
            const isSameDomain = absoluteUrl.hostname === domain;
            const isVisited = visited.has(absoluteUrl.toString());
            const inQueue = queue.includes(absoluteUrl.toString());
            const isAsset = /\.(pdf|jpg|jpeg|png|gif|zip|doc|docx|css|js|mp4)$/i.test(absoluteUrl.pathname);

            if (isSameDomain && !isVisited && !inQueue && !isAsset) {
               // Prevent queue bloating
               if (queue.length < 50) {
                 queue.push(absoluteUrl.toString());
               }
            }
          } catch (e) {
             // Invalid URL in href, safely skip
          }
        });

      } catch (err) {
        console.error(`[Crawler] Failed page ${currentUrl}:`, err);
      } finally {
        await page.close();
      }
      
      // Micro-throttle to be nice to the destination server
      await new Promise(r => setTimeout(r, 500));
    }

    return results;

  } finally {
    console.log(`[Crawler] Shutdown. Crawled ${results.length} pages.`);
    await browser.close();
  }
}
