const https = require('https');
const fs = require('fs');

const API_KEY = fs.readFileSync('./api-key.txt', 'ascii', (err, data) => {
    if (err) return console.error(err)
    console.log('got api key')
    return data
})

const BASE_PATH = 'https://api.krakenflex.systems/interview-tests-mock-api/v1'
const OUTAGES_END_POINT = '/outages'
const SITEINFO_END_POINT = '/site-info/norwich-pear-tree'
const SITEOUTAGES_END_POINT = '/site-outages/norwich-pear-tree'
const OPTIONS = {
    headers: {
        "x-api-key": API_KEY
    }
  }

// ----------------------------------------------------------

const OUTAGES_URL = `${BASE_PATH}${OUTAGES_END_POINT}` // Outages
const SITEINFO_URL = `${BASE_PATH}${SITEINFO_END_POINT}` // site-info
const SITEOUTAGES_URL = `${BASE_PATH}${SITEOUTAGES_END_POINT}` // site-outages

async function getOutages() {
    const listOfOutages = await new Promise ((resolve, reject) => {
        https.get(OUTAGES_URL, OPTIONS, res => {
            if (res.statusCode === 200) {
                 let rawData = ''
        
                res.on('data', chunk => {
                    // construct the data from chunks
                    rawData += chunk
                })
        
                res.on('end', () => {
                    const parsedData = JSON.parse(rawData)

                    resolve(parsedData)
                })
            } // add errors for other error codes
        }).on('error', error => {
            reject(console.log('source: getOutages()', error))
        })
    })
    return listOfOutages
}

async function getSiteInfo() {
    const listOfSites = await new Promise ((resolve, reject) => {
        https.get(SITEINFO_URL, OPTIONS, res => {
            if (res.statusCode === 200) {
                 let rawData = ''
        
                res.on('data', chunk => {
                    // construct the data from chunks
                    rawData += chunk
                })
        
                res.on('end', () => {
                    let parsedData = JSON.parse(rawData)

                    resolve(parsedData)
                })
            } // add errors for other error codes
        }).on('error', error => {
            reject(console.log('source: getSiteInfo()', error))
        })
    })
    return listOfSites
}

async function sendUpdatedSiteData(data) {
    const newOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(data).length,
            ...OPTIONS.headers
        },
        hostname: SITEOUTAGES_URL,
        path: `${SITEOUTAGES_END_POINT}`,
        method: "POST"
    }

    console.log(newOptions)

    const updatedSiteData = await new Promise ((resolve, reject) => {
        const request = https.request(newOptions, res => {
                res.on('data', function (chunk) {
                    console.log('Response: ' + chunk);
                });
            })

            request.write(JSON.stringify(data));
            request.end()
    })

    // return updatedSiteData
}

async function getAllData() {
    const outages = await new Promise((resolve, reject) => {
        const ww = Promise.all([getSiteInfo(), getOutages()])
        .then((data) => {
            const siteInfo = data[0]
            const outages = data[1].filter(outage => new Date(outage.begin).getTime() > new Date('2022-01-01T00:00:00.000Z').getTime())
            const newArray = []

            // mergin outages information into site data
            for (let i =0; i < outages.length; i++) {
                for (let j =0; j < siteInfo.devices.length; j++) {
                    // iterating over both arrays and comparing ids
                    if (outages[i].id === siteInfo.devices[j].id) {
                        newArray.push({
                            ...siteInfo.devices[j],
                            ...outages[i]
                        })
                    }
                }
            }
            return newArray
        }).then((data) => {
            // console.log(data)
            sendUpdatedSiteData(data)
            // got the finished data
            // now send data to server
        })
    })
}

getAllData()