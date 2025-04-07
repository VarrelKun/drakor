const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BASE_URL = "https://tv16.nontondrama.click";
const PROXY_HOST = "43.128.96.101";
const PROXY_PORT = 3128;

/**
 * Scraping halaman home untuk mendapatkan daftar drama terbaru.
 */
async function scrapeHome() {
    try {
        const { data } = await axios.get(BASE_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const dramas = [];

        $('.infscroll-item').each((i, el) => {
    let title = $(el).find('.grid-title a').text().trim();
    const url = $(el).find('.grid-title a').attr('href') || '';
    const image = $(el).find('.grid-poster img').attr('src') || '';
    const rating = $(el).find('.rating').text().trim() || 'N/A';
    const episodes = $(el).find('.last-episode span').text().trim() || 'Unknown';
    const urlParts = url.split('/').filter(Boolean);
    const slug = urlParts.pop();
    title = title.replace(/^Nonton\s+/i, '')
    title = title.replace(/\s*Film Subtitle Indonesia Streaming Movie Download$/i, '')
    title = title.replace(/\t?Season\s*\d+/i, '')
    dramas.push({ title: title.trim(), slug, image, episodes });
});

        return dramas.length > 0 ? dramas : { error: "Tidak ada data yang ditemukan" };

    } catch (error) {
        return { error: "Gagal mengambil data dari halaman utama" };
    }
}

async function dramaHome(page) {
    try {
        const { data } = await axios.get(`https://tv16.nontondrama.click/country/south-korea/page/${page}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const dramas = [];

        $('.infscroll-item').each((i, el) => {
    let title = $(el).find('.grid-title a').text().trim();
    const url = $(el).find('.grid-title a').attr('href') || '';
    const image = $(el).find('.grid-poster img').attr('src') || '';
    const rating = $(el).find('.rating').text().trim() || 'N/A';
    const episodes = $(el).find('.last-episode span').text().trim() || 'Unknown';
    const urlParts = url.split('/').filter(Boolean);
    const slug = urlParts.pop();
    title = title.replace(/^Nonton\s+/i, '')
    title = title.replace(/\s*Film Subtitle Indonesia Streaming Movie Download$/i, '')
    title = title.replace(/\t?Season\s*\d+/i, '')
    dramas.push({ title: title.trim(), slug, image, episodes });
});

        return dramas.length > 0 ? dramas : { error: "Tidak ada data yang ditemukan" };

    } catch (error) {
        return { error: "Gagal mengambil data dari halaman utama" };
    }
}

/**
 * Scraping halaman detail drama berdasarkan slug.
 */
async function scrapeDetail(slug) {
    try {
        const { data } = await axios.get(`https://tv16.nontondrama.click/${slug}/`, {
            headers: { 
					'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
				}
        })
        const $ = cheerio.load(data)

        let title = $('.serial-wrapper .season-list h4').first().text().trim()
            .replace(/^Nonton /, '').replace(/ ‐ Season \d+$/, '').trim()
        let synopsis = $('blockquote strong:contains("Synopsis")').parent().text().replace('Synopsis', '').trim() || "Tidak ada sinopsis"
        let genres = $('h2:contains("Genre")').next().find('a').map((_, el) => $(el).text().trim()).get()
        let status = $('h2:contains("Status")').next().text().trim() || "Unknown"
        let date = $('h2:contains("Diterbitkan")').next().text().trim() || "Undefined"
        let image = $('.content-poster img').attr('src')
        if (image && image.startsWith('//')) image = 'https:' + image
        let episodes = $('.episode-list a.btn-primary').map((_, el) => ({
            title: 'Episode ' + $(el).text().trim(),
            slug: $(el).attr('href')?.split('/').filter(Boolean).pop() || "#"
        })).get()

        return { title, status, date, genres, synopsis, image, episodes }
    } catch {
        return { error: "Data tidak ditemukan atau URL tidak valid" }
    }
}

/**
 * Scraping detail episode drama berdasarkan slug.
 */
async function episodeDetail(episodeSlug) {
    try {
        if (!episodeSlug) throw new Error("Episode slug tidak boleh kosong");

        const baseUrl = "https://tv16.nontondrama.click/";
        const episodeUrl = `${baseUrl}${episodeSlug}/`;

        const { data } = await axios.get(episodeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const providers = [];

        $("#loadProviders li a").each((_, el) => {
            const providerName = $(el).text().trim();
            const providerUrl = $(el).attr("href");

            if (providerName && providerUrl) {
                try {
                    const urlObj = new URL(providerUrl);
                    const realUrl = decodeURIComponent(urlObj.searchParams.get("url"));

                    if (realUrl) {
                        providers.push({ provider: providerName, iframeUrl: realUrl });
                    }
                } catch (err) {
                    console.warn(`Gagal memproses URL: ${providerUrl}`);
                }
            }
        });

        if (!providers.length) return { episodeSlug, error: "❌ Provider tidak ditemukan" };

        return { episodeSlug, providers };
    } catch (error) {
        return { episodeSlug, error: error.message };
    }
}

/**
 * Scraping pencarian drama berdasarkan query.
 */
async function searchDrama(search) {
    try {
    	const linkImg = "https://s3.lk21static.buzz"
        const { data } = await axios.get(`https://tv16.nontondrama.click/search.php?s=${encodeURIComponent(search)}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        return $('.search-item').map((i, el) => ({
            title: $(el).find('.search-content h3 a').text().trim(),
            slug: ($(el).find('.search-content h3 a').attr('href') || '').replace(/^\/+/, ''),
            image: new URL($(el).find('.search-poster figure a:nth-child(2) img').attr('src') || '', linkImg).href,
            stars: $(el).find('.search-content p:contains("Bintang")').text().replace("Bintang:", "").trim()
        })).get();

    } catch (error) {
        throw new Error("Gagal mengambil data dari situs");
    }
}

/**
 * Scraping detail movie berdasarkan slug.
 */
async function movieDetail(slug) {
  const url = `https://tv3.lk21official.cc/${slug}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36",
      },
    });

    const $ = cheerio.load(data);

    let title = $('.post-header h2').text().trim();
    title = title.replace(/\s*Film Subtitle Indonesia Streaming\s*\/\s*Download$/i, '');
    title = title.replace(/\t?Season\s*\d+/i, '') 
    const thumbnail = $('.content-poster img').attr('src')?.replace(/^\/\//, 'https://');
    const kualitas = $('h2:contains("Kualitas")').next('h3').text().trim();
    const negara = $('h2:contains("Negara")').next('h3').text().trim();
    const genre = $('h2:contains("Genre")').next('h3').text().split(',').map(g => g.trim());
    const dir = $('h2:contains("Sutradara")').next('h3').text().trim();
    const stars = $('h2:contains("Bintang film")').nextAll('h3').map((i, el) => $(el).text().trim()).get();
    const date = $('h2:contains("Diterbitkan")').next('h3').text().trim();
    const translator = $('h2:contains("Penerjemah")').next('h3').text().trim();
    const synopsis = $('blockquote strong:contains("Synopsis")')
      .parent()
      .text()
      .replace('Synopsis', '')
      .trim();

    let streams = [];

    // UPDATE DI SINI: scrape dari #loadProviders
    $('#loadProviders li a').each((i, el) => {
      const href = $(el).attr('href');
      const label = $(el).text().trim();
      const quality = $(el).attr('rel') || 'unknown';

      if (href && !href.includes('ads')) {
        streams.push({
          label,
          url: href.startsWith('//') ? 'https:' + href : href,
          quality,
        });
      }
    });

    // Fallback ke tv16 jika kosong
    if (streams.length === 0) {
      try {
        const alt = await axios.get(`https://tv16.nontondrama.click/${slug}`);
        const _$ = cheerio.load(alt.data);
        _$('iframe').each((i, el) => {
          const src = _$(el).attr('src');
          if (src && !src.includes('ads')) {
            streams.push({
              label: 'Backup',
              url: src.startsWith('//') ? 'https:' + src : src,
              quality: 'unknown'
            });
          }
        });
      } catch (e) {
        // Biarin aja kalo fallback gagal
      }
    }

    return {
      title,
      negara,
      genre,
      date,
      synopsis,
      streams
    };

  } catch (err) {
    return { error: true, message: err.message };
  }
}

async function movieHome(page) {
    try {
        const { data } = await axios.get(`https://tv3.lk21official.cc/latest/page/${page}/`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        const dramas = [];

        $('.infscroll-item').each((i, el) => {
    let title = $(el).find('.grid-title a').text().trim();
    const url = $(el).find('.grid-title a').attr('href') || '';
    const image = $(el).find('.grid-poster img').attr('src') || '';
    const rating = $(el).find('.rating').text().trim() || 'N/A';
    const episodes = $(el).find('.last-episode span').text().trim() || 'Unknown';
    const urlParts = url.split('/').filter(Boolean);
    const slug = urlParts.pop();
    title = title.replace(/^Nonton\s+/i, '')
    title = title.replace(/\s*Film Subtitle Indonesia Streaming Movie Download$/i, '')
    title = title.replace(/\t?Season\s*\d+/i, '')
    dramas.push({ title: title.trim(), slug, image });
});

        return dramas.length > 0 ? dramas : { error: "Tidak ada data yang ditemukan" };

    } catch (error) {
        return { error: "Gagal mengambil data dari halaman utama" };
    }
}

module.exports = { scrapeHome, scrapeDetail, dramaHome, searchDrama, episodeDetail, movieHome, movieDetail };
