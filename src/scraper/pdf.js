const fs 		= require('fs');
const pdf 		= require('pdf-parse');
const path 		= require('path');
const crypto 	= require('crypto');
const request 	= require("request-promise-native");

async function compare() 
{
	let oldFilePath = path.resolve( __dirname, "sample.pdf")
	let newFilePath = path.resolve( __dirname, "remotePDF.pdf")

	let remotePDFURL = 'https://github.com/BruceBGordon/votedotorg-state-site-tracking/raw/Will-Scraping/src/scraper/sample-changes-different.pdf'

    let pdfBuffer = await request.get({uri: remotePDFURL, encoding: null});
    
    console.log("Writing downloaded PDF file to " + newFilePath + "...");
    
    fs.writeFileSync(newFilePath, pdfBuffer);

	let oldFileDataBuffer = fs.readFileSync(oldFilePath);
	let newFileDataBuffer = fs.readFileSync(newFilePath);

	pdf(oldFileDataBuffer).then(function(data) 
	{
	    let oldPDFText = data.text;
		var oldPDFHash = crypto.createHash('md5').update(oldPDFText).digest('hex');

	    pdf(newFileDataBuffer).then(function(data) 
		{
		    let newPDFText = data.text;

		    var newPDFHash = crypto.createHash('md5').update(newPDFText).digest('hex');

		    if (newPDFHash === oldPDFHash)
		    {
    			console.log("Hashes match");
		    }
		    else
		    {
    			console.log("Hashes do not match");
		    }
		});
	});
}

compare()
