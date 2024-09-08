// require the dotenv package
require('dotenv').config();

// require the express package
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

// create an instance of express
const app = express();

// server port number
const PORT = process.env.PORT || 3000;

// set the view engine to ejs
app.set('view engine', 'ejs');

// set the views directory
app.set('views', path.join(__dirname, 'views'));

// set the static folder
app.use(express.static('public'));

// needed to parse the body of the request
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Thêm hàm extractVideoId
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// set the home route
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/convert-mp3', async (req, res) => {
    const videoUrl = req.body.videoUrl;
    const videoId = extractVideoId(videoUrl);
    if (
        videoId === undefined ||
        videoId === null ||
        videoId === ""
    ) {
        return res.render('index', {success: false, message: "Please enter a valid YouTube URL"});
    } else {
        const fetchData = async () => {
            const response = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': process.env.API_KEY,
                    'X-RapidAPI-Host': process.env.API_HOST
                }
            });
            return await response.json();
        };

        let data = await fetchData();

        while (data.status === "processing") {
            await new Promise(resolve => setTimeout(resolve, 60000));
            data = await fetchData();
        }

        while (data.status === "fail") {
            await new Promise(resolve => setTimeout(resolve, 60000));
            data = await fetchData();
        }

        if (data.status === "ok") {
            return res.render('index', {success: true, message: "Video converted successfully", song_title: data.title, song_link: data.link, videoUrl: videoUrl});
        } else {
            return res.render('index', {success: false, message: "Something went wrong. Please try again later"});
        }
    }
});

app.listen(PORT, () => {
   console.log(`Server is running on port ${PORT}`);
});
