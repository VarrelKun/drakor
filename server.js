const express = require('express');
const routes = require('./routes');
const cors = require("cors");

const app = express();
const PORT = 3000;

app.set("json spaces", 2);
app.use(express.json());
app.use(cors())

app.use('/api', routes);

// Menampilkan daftar route dalam "/api"
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to Drakor API",
        author: "© gopalasu",
        endpoints: {
            home: "/api/home",
            drama: "/api/drama/:page",
            detail: "/api/detail/:slug",
            episode: "/api/episode/:slug",
            search: "/api/search/:search",
            movie: "/api/movie/:page",
            "movie detail": "/api/movie/x/:slug"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Online http://localhost:${PORT}`);
});
