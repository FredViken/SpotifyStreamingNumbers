const fetch = require('node-fetch');
const Headers = require('./dbConfig');

async function getArtist(artistId, callback) {
    try {
        // get headers for private Spotify API
        const headers = await Headers.findOne({
            'type': 'spotify'
        });

        // fetch artist data and discography data in parallel
        const [artistResponse, discographyResponse, features] = await Promise.all([
            fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistOverview&variables={"uri":"spotify:artist:${artistId}","locale":""}&extensions={"persistedQuery":{"version":1,"sha256Hash":"b82fd661d09d47afff0d0239b165e01c7b21926923064ecc7e63f0cde2b12f4e"}}`, {
                headers: headers.headers,
                body: null,
                method: "GET"
            }),
            fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistDiscographyAll&variables={"uri":"spotify:artist:${artistId}","offset":0,"limit":100}&extensions={"persistedQuery":{"version":1,"sha256Hash":"35a699e12a728c1a02f5bf67121a50f87341e65054e13126c03b7697fbd26692"}}`, {
                headers: headers.headers,
                body: null,
                method: "GET"
            }),
            fetch(`https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistAppearsOn&variables={"uri":"spotify:artist:${artistId}"}&extensions={"persistedQuery":{"version":1,"sha256Hash":"ebcdf2ec4979e27187d7fcaca889ed8593e8331888992103724166bd38cbb5a8"}}`, {
                headers: headers.headers,
                method: "GET"
            })
        ]);

        // convert responses to JSON format
        const artistjson = await artistResponse.json();
        const discographyJson = await discographyResponse.json();
        const featuresjson = await features.json();

        // if discography consists of more than 100 albums/compilations, use multiple GET requests
        let discography = [discographyJson];
        let totalCount = discography[0].data.artistUnion.discography.all.totalCount;

        if (totalCount > 100) {
            for (let i = 100; i < totalCount; i += 100) {
                const res = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryArtistDiscographyAll&variables={"uri":"spotify:artist:' + artistId + '","offset":' + i + ',"limit":100}&extensions={"persistedQuery":{"version":1,"sha256Hash":"35a699e12a728c1a02f5bf67121a50f87341e65054e13126c03b7697fbd26692"}}', {
                    "headers": headers.headers,
                    "body": null,
                    "method": "GET"
                });

                const resjson = await res.json()
                discography.push(resjson)
            }
        }

        let data = []
        // gets artist's lead albums
        async function getDiscography() {
            for (let i = 0; i < discography.length; i++) {
                element = discography[i]
                let albums = element.data.artistUnion.discography.all.items;

                for (let j = 0; j < albums.length; j++) {
                    let a = albums[j].releases.items[0]

                    const albumResponse = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryAlbumTracks&variables={"uri":"spotify:album:' + a.id + '","offset":0,"limit":300}&extensions={"persistedQuery":{"version":1,"sha256Hash":"f387592b8a1d259b833237a51ed9b23d7d8ac83da78c6f4be3e6a08edef83d5b"}}', {
                        "headers": headers.headers,
                        "method": "GET"
                    });

                    const albumjson = await albumResponse.json();
                    let trackData = []
                    let tracks = albumjson.data.albumUnion.tracks.items

                    for (let h = 0; h < tracks.length; h++) {
                        let t = tracks[h]


                        if (t.track.artists.items.some(e => e.uri === 'spotify:artist:' + artistId)) {
                            trackData.push({
                                trackNumber: t.track.trackNumber,
                                img: a.coverArt.sources[0].url,
                                name: t.track.name,
                                streams: t.track.playcount,
                                uid: t.uid
                            })
                        }
                    }

                    data.push({
                        name: a.name,
                        id: a.id,
                        img: a.coverArt.sources[0].url,
                        tracks: trackData
                    });
                }
            }
        }


        let featuresAlbums = featuresjson.data.artistUnion.relatedContent.appearsOn.items;

        let featuresData = []
        // get all songs/albums the artist is featured on
        async function getFeatures() {
            const promises = featuresAlbums.map(async (featuresAlbum) => {
                const album = featuresAlbum.releases.items[0];
                const albumResponse = await fetch('https://api-partner.spotify.com/pathfinder/v1/query?operationName=queryAlbumTracks&variables={"uri":"spotify:album:' + album.id + '","offset":0,"limit":300}&extensions={"persistedQuery":{"version":1,"sha256Hash":"f387592b8a1d259b833237a51ed9b23d7d8ac83da78c6f4be3e6a08edef83d5b"}}', {
                    headers: headers.headers,
                    method: 'GET'
                });
                const albumjson = await albumResponse.json();
                const tracks = albumjson.data.albumUnion.tracks.items;
                const filteredTracks = tracks.filter((t) => {
                    const artists = t.track.artists.items;
                    return artists.some((el) => el.uri === 'spotify:artist:' + artistId);
                });
                return filteredTracks.map((t) => ({
                    trackNumber: t.track.trackNumber,
                    img: album.coverArt.sources[0].url,
                    name: t.track.name,
                    streams: t.track.playcount,
                    uid: t.uid
                }));
            });

            const results = await Promise.all(promises);
            results.forEach((albumData) => {
                albumData.forEach((trackData) => {
                    featuresData.push(trackData);
                });
            });
        };

        await Promise.all([getDiscography(), getFeatures()]);

        data.push({
            name: 'Features',
            id: 'features',
            img: '',
            tracks: featuresData
        });

        let artist = {
            name: artistjson.data.artistUnion.profile.name,
            img: artistjson.data.artistUnion.visuals.avatarImage.sources[0].url,
            followers: artistjson.data.artistUnion.stats.followers,
            monthlyListeners: artistjson.data.artistUnion.stats.monthlyListeners,
            worldRank: artistjson.data.artistUnion.stats.worldRank,
            topCities: artistjson.data.artistUnion.stats.topCities.items,
            albums: artistjson.data.artistUnion.discography.albums.items,
            discography: data
        }

        if (callback != undefined) {
            callback(artist)
        } else {
            return artist
        }
    } catch (e) {
        console.error(e);
    }

}

module.exports = getArtist;