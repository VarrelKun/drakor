const express = require('express');
const { scrapeHome, scrapeDetail, dramaHome, episodeDetail, searchDrama, movieHome, movieDetail } = require('./scraper/drakorScraper')

const router = express.Router();

router.get('/home', async (req, res) => {
    const data = await scrapeHome();
    res.json(data);
});

router.get('/drama/:page', async (req, res) => {
	const { page } = req.params;
    const data = await dramaHome(page);
    res.json(data);
});

router.get('/movie/:page', async (req, res) => {
	const { page } = req.params;
    const data = await movieHome(page);
    res.json(data);
});

router.get('/top', async (req, res) => {
    const data = await topDrama();
    res.json(data);
});

router.get('/detail/:slug', async (req, res) => {
    const { slug } = req.params;
    const data = await scrapeDetail(slug);
    res.json(data);
});

router.get('/movie/x/:slug', async (req, res) => {
    const { slug } = req.params;
    const data = await movieDetail(slug);
    res.json(data);
});

router.get('/episode/:slug', async (req, res) => {
    const { slug } = req.params;
    const data = await episodeDetail(slug);
    res.json(data);
});

router.get('/search/:search', async (req, res) => {
    const { search } = req.params;
    const data = await searchDrama(search);
    res.json(data);
});

module.exports = router;
