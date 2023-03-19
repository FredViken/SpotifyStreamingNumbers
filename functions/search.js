const Headers = require('./dbConfig');
const fetch = require('node-fetch');

// Search for artist uri based on name
async function search(query, callback){
  try{
    const headers = await Headers.findOne({'type':'spotify'}); 

    let response = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?operationName=searchDesktop&variables={"searchTerm":"' + query + '","offset":0,"limit":10,"numberOfTopResults":5,"includeAudiobooks":true}&extensions={"persistedQuery":{"version":1,"sha256Hash":"1d3a8f81abf4f33f49d1e389ed0956761af669eedb62a050c6c7bce5c66070bb"}}', {
      headers: headers.headers,
      body: null,
      method: "GET"
    });

    let uri = await response.json();
    uri = await (uri.data.searchV2.artists.items[0].data.uri).split(':')[2];

    if(callback != undefined){
      callback(uri)
    } else {
      return uri
    }

  } catch (e){

    console.error(e);
    if(callback != undefined){
      callback(undefined)
    } else {
      return undefined
    }
    
  }
  
}

module.exports = search;