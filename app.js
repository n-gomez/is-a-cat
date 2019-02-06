const express = require('express');
const path = require('path');
const visionRoute = require('./routes/vision');


// Initialize app
const app = express();

// EJS viewer
app.set('view engine', 'ejs');

// Public folder
app.use(express.static('./public'));

app.get('/', (req, res) => res.render('index'));

app.use(visionRoute);

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.sendFile(path.join(__dirname, '/public/500.html'));
});

app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, '/public/404.html'));
});

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server started on port ${port}`));



