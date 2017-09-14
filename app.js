const express = require('express');
const cors = require('cors')
const app = express();
const request = require('request');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const API_KEY = process.env.API_KEY;
const API_BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE_URL = 'https://image.tmdb.org/t/p/w500';

app.use(cors());

app.get('/api/v1/movies/:name', (req, res) => {
  const name = req.params.name;
  request(`${API_BASE_URL}/search/movie?api_key=${API_KEY}&query=${name}`, (error, response, body) => {
    const movies = JSON.parse(body).results.map(movie => {
      movie.full_poster_path = `${IMG_BASE_URL}/${movie.poster_path}`;
      movie.full_backdrop_path = `${IMG_BASE_URL}/${movie.backdrop_path}`;
      return movie;
    });

    const [head, ...tail] = movies;
    publishNewMovie(name, tail);

    res.json(head);
  });
});

const publishNewMovie = (name, movies) => {
  if (movies.length > 0) {
    setTimeout(() => {
      const [head, ...tail] = movies;
      const event = Object.assign({}, head, {status: 'active'});
      io.sockets.emit(`movies.${name}`, JSON.stringify(event));
      publishNewMovie(name, tail);
    }, 5000);
  } else {
    io.sockets.emit(`movies.${name}`, JSON.stringify({status: 'terminated'}));
  }
};

app.get('/test.html', function(req, res) {
  res.sendFile(__dirname + '/static/test.html');
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/static/index.html');
});

io.on('connection', function(client) {
  console.log('Client connected...');

  client.on('join', function (data) {
    console.log(data);
  });
});

server.listen(process.env.PORT || 5000);