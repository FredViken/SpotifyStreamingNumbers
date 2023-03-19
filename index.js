// index.js
require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const ejs = require('ejs');
const search = require('./functions/search');
const getArtist= require('./functions/getArtist')



//Initialize express app
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));
app.use(express.json())

const port = process.env.PORT || 3000;

// Routing

app.get('/', (req,res) => {

  res.render('search', {
    title:'Search',
  })

});

app.post('/', async (req,res) => {

  const input = req.body.query;
  
  let id = await search(input);
  if(id){
    res.redirect('/'+ id)
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


app.listen(port,() => {
  console.log('Server started on port ' + port);
});