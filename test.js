const Spotify = require('spotify-web-api-node');
require('dotenv').config();
const port = process.env.PORT || 3000;

// Create a new Spotify API object
const spotifyApi = new Spotify({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    redirectUri: 'http://localhost:'+ port +'/callback'
});

// Retrieve an access token.
spotifyApi.clientCredentialsGrant().then(
    function(data) {
      console.log('The access token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
  
      // Save the access token so that it's used in future calls
      spotifyApi.setAccessToken(data.body['access_token']);
    },
    function(err) {
      console.log('Something went wrong when retrieving an access token', err);
    } 
);

setTimeout(async() => {
    let a = await spotifyApi.getArtistAlbums('1HY2Jd0NmPuamShAr6KMms')
    console.log(a);
    spotifyApi.getartist
}, 3000)


