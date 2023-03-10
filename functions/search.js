const spotifyApi = require('./spotifyConfig');

// Search for artist uri based on name
async function search(query, callback){
    let uri = (await spotifyApi.searchArtists(query)).body.artists.items[0]

    if(callback != undefined){
      callback(uri)
    } else {
      return uri
    }
}

module.exports = search;