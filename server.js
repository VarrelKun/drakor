const express = require('express');
const routes = require('./routes');

const app = express();
const PORT = 3000;

app.set("json spaces", 2);
app.use(express.json());

app.use('/api', routes);

// Menampilkan daftar route dalam "/api"
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to Drakor API",
        author: "© gopalasu",
        endpoints: {
            home: "/api/home",
            detail: "/api/detail/:slug",
            episode: "/api/episode/:slug",
            search: "/api/search/:search"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Online http://localhost:${PORT}`);
});
