const 
    url = require('url'),
    chalk = require('chalk'),
    cppService = require('../service/cppService');

async function requestHandler(req, res) {
    var reqURL = url.parse(req.url);
    var urlPath = reqURL.pathname.substring(1).split("/");
    var reqBody;
    var reqMethod = req.method;
    const reqProm = new Promise((resolve,reject) => {
        var reqRaw="";
        req.on('data',(data) => {
            reqRaw += data;
        }); 
        req.on('error', (e) => {
            console.log(e);
            resolve(1);
        });
        req.on('end', ()=> {
            if(reqRaw) {
               reqBody = JSON.parse(reqRaw.toString()); 
            } 
            resolve(0);
        });
    });

    //setting default response headers
    res.setHeader('Access-Control-Allow-Origin', "*");
    res.setHeader('Access-Control-Allow-Headers', "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.setHeader("Content-Type", "text/plain");
    res.statusCode = 200;

    //if req fails send back err
    if(await reqProm === 1) {
        res.writeHead(400);
        res.end();
        console.log("request failed");
    } 
    
    switch (urlPath[0]) {
        case 'cppCompile':
            cppCompileRoute(urlPath, reqMethod, reqBody, res);
            break;
        default:
            res.writeHead(404);
            res.end();
            console.log('endpoint does not exist')
            break;
    }
}

// seperate to make stuff more readable
function cppCompileRoute(urlPath, reqMethod, reqBody, res) {
    if(urlPath[1] === 'id' && reqMethod === 'GET' )  {
        cppService.getID(reqBody, res);
    }
    else if(urlPath[1] === 'saveFile' && reqMethod === 'POST' )  {
        cppService.saveFile(reqBody,res);
    }
    else if(urlPath[1] === 'compile' && reqMethod === 'POST') {
        cppService.compileProgram(reqBody, res);
    }
    else if(urlPath[1] === 'stopProgram' && reqMethod === 'POST') {
        cppService.stopProgram(reqBody,res);
    }
    else {
        res.writeHead(404);
        res.end();
        console.log('cppCompile endpoint does not exist')
    }
}

module.exports = {
    requestHandler: requestHandler
};