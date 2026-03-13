'use server';

import * as cheerio from 'cheerio';

export async function ingestUrl(url: string) {
  try {
    // Basic validation
    new URL(url);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove unnecessary elements
    $('script, style, nav, footer, header, aside, noscript, iframe').remove();

    // Extract title
    const title = $('title').text().trim() || url;

    // Extract main text content
    // Fallback to body if no main/article tag is found
    let content = $('article, main, .content, #content').text();
    if (!content.trim()) {
      content = $('body').text();
    }

    // Clean up whitespace
    const cleanContent = content.replace(/\s+/g, ' ').trim();

    // Note: In a full production app, you would insert this into Supabase here:
    // const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    // await supabase.from('sources').insert({ title, content: cleanContent, type: 'url', url, user_id: '...' });

    return { success: true, title, content: cleanContent };
  } catch (error: any) {
    console.error('Ingest Error:', error);
    return { success: false, error: error.message || 'Failed to ingest URL' };
  }
}
