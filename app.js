// index.js
require('dotenv').config();

const fetch = require('node-fetch');
const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const search = require('./functions/search');
const getArtist= require('./functions/getArtist')
const spotifyApi = require('./functions/spotifyConfig');


//Initialize express app
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.json())

const port = process.env.PORT || 3000;
let artist;
// (async () => {
//   artist = await getArtist('1HY2Jd0NmPuamShAr6KMms');
//   console.log('ok');
// })();

// Routing

app.get('/', (req,res) => {

  res.render('search', {
    title:'Search',
  })

});

app.post('/', async (req,res) => {

  const input = req.body.query;
  
  let artist = await search(input);
  if(artist){
    let artistId = artist.id
    res.redirect('/'+ artistId)
  } else {
    res.redirect('/#error')
  }
  
})

app.get('/:id', async (req,res) => {
  const id = req.params.id;
  let artist = await getArtist(id);
  res.render('artist', {
    title: artist.name,
    artist: artist
  })
  
})

// setTimeout(async() => {
   
//    let artist = await search('Adele');
//    let uri = artist.id
//    let discography = await getDiscography(uri)

//    console.log(discography);
// }, 1000)

app.listen(port,() => {
  console.log('Server started on port ' + port);
});