/* jshint esnext: true */

'use strict';

const fs = require('fs');
const request = require('request');
const _ = require('underscore');
//const HttpClientClass = require('bbc-http-client');

let resultArray = [];

let ThisWeek = function () {};

ThisWeek.prototype.getThisweek = function (){
  let that = this;

  return new Promise(function (fulfill, reject){

    that._fetchFromCpsSolr()
    .then(that._fetchAllFromCandy.bind(that))
    .then(that._fetchAllTagsFromLdp.bind(that))
    .then(results => {
      //console.log(results);
      //console.log (_.groupBy(results, (result) => { return result.tag }))
      let returnObject = {
        results: [
          {
            "rangeIn": "2017-02-21T12:34:46+00:00",
            "rangeOut": "2017-02-14T12:34:46+00:00",
            "tags": [_.groupBy(results, (result) => { return result.tag })]
          }
        ]
      };

      var sortable = [];
      for (var tag in returnObject.results[0].tags[0]) {
          sortable.push([tag, returnObject.results[0].tags[0][tag]])
      }

      sortable.sort(function(a, b) {
          return a[1].length - b[1].length
      })

      var newObj = {}
      for (var i = sortable.length - 1; i >= 0; i--) {
        if (sortable[i][0].length > 0) {
          newObj[sortable[i][0]] = sortable[i][1];
        }

      };
      returnObject.results[0].tags[0] = newObj;
      console.log(JSON.stringify(newObj));

      fulfill(returnObject);
    })
    .catch(err => {
      console.log("processing failed ", err);
    })
  });
}

ThisWeek.prototype._fetchFromCpsSolr = function() {
  console.log("fetchinf rom solr", this);
  return new Promise(function (fulfill, reject){
    fulfill(JSON.parse(fs.readFileSync(__dirname+"/../cps_solr_500.json", 'utf8')));
    // let options = {
    //   'url': 'http://cpssolr.live.newsonline.tc.nca.bbc.co.uk:8080/solr/select?qt=English&wt=json&fq=dateWeek:51105&fq=status:%22Published%22&sort=dateFull%20desc,score%20desc&rows=1000&&fq=type:%22STY%22&fq=siteName:"News v6"',
    //   'method': 'GET',
    // }
    // request(options, (error, response, body) => {
    //   if (!error && response.statusCode == 200) {
    //     let bodyObj = JSON.parse(response.body);


    //     fulfill(bodyObj)
    //   } else {
    //     console.log("Candy fetch failed: ", response),//,error, response.statusCode, response.body)
    //     reject(error);
    //   }
    // })
  })
}


ThisWeek.prototype._fetchAllFromCandy = function(solrResponses) {
  return Promise.all(solrResponses.response.docs.map(this._fetchFromCandy))
}

ThisWeek.prototype._fetchFromCandy = function(item) {
  console.log('http://content-api-a127.api.bbci.co.uk/cms/cps/asset/'+item.id+'?api_key=')
  let options = {
    'url': 'http://content-api-a127.api.bbci.co.uk/cms/cps/asset/'+item.id+'?api_key=',
    'method': 'GET',
    headers: {
      'X-Candy-Audience': 'domestic',
      'Accept': 'application/json',
      'X-Candy-Platform': 'mobile',
    },
    noProxy: true
  }

  return new Promise(function (fulfill, reject){
    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let bodyObj = JSON.parse(response.body);

        let image = '';
        if (typeof bodyObj.results[0].media !== 'undefined') {
          if (typeof bodyObj.results[0].media.images.index !== 'undefined') {
            if (typeof bodyObj.results[0].media.images.index[Object.keys(bodyObj.results[0].media.images.index)[0]] !== 'undefined') {
              image = bodyObj.results[0].media.images.index[Object.keys(bodyObj.results[0].media.images.index)[0]];
            }
          }
        }

        let story = {
          "title": bodyObj.results[0].title,
          "uri":  bodyObj.results[0].id,
          "image": image.href,
          "summary": bodyObj.results[0].summary,
          "published": bodyObj.results[0].lastPublished
        }
        fulfill(story)
      } else {
        //console.log("Candy fetch failed: ", response),//,error, response.statusCode, response.body)
        //reject(error);
        fulfill({})
      }
    })
  })
}

ThisWeek.prototype._fetchAllTagsFromLdp = function(stories) {
  console.log('fetchinf all from ldp');
  return Promise.all(stories.map(this._fetchFromLdp))
}

ThisWeek.prototype._fetchFromLdp = function(story) {
  if (typeof story.uri === 'undefined') return story;
  let uri = story.uri.replace('http://www.bbc.co.uk/asset/', '');

  let options = {
    'url': 'http://ldp-core.api.bbci.co.uk/ldp-core/creative-works-v2?locator=urn:asset:'+uri+'&api_key=',
    'method': 'GET',
    headers: {
      'Accept': 'application/json-ld',
    },
  }

  return new Promise(function (fulfill, reject){
    request(options, (error, response, body) => {
      if (!error && response.statusCode == 200) {
        let bodyObj = JSON.parse(response.body);
        let tag = '';
        let tagId = '';
        if (typeof bodyObj.results !== 'undefined') {
          if (typeof bodyObj.results[0].about !== 'undefined') {
            tagId = bodyObj.results[0].about[0]['@id']
            tag = bodyObj.results[0].about[0].label
          }
        }
        story.tag = tag;
        story.tagId = tagId;
        fulfill(story)
      } else {
        console.log("LDP fetch failed: ", error),//,error, response.statusCode, response.body)
        reject(error);
      }
    })
  })
}

module.exports = new ThisWeek();
