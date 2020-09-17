const fs 		= require('fs');
const pdf 		= require('pdf-parse');
const path 		= require('path');
const crypto 	= require('crypto');
const request 	= require("request-promise-native");

async function comparePDFs(pdfToRetrieve) 
{
	var oldPDFHash 		= pdfToRetrieve.hash
	let newFilePath 	= path.resolve( __dirname, "remotePDF.pdf")
	let remotePDFURL 	= pdfToRetrieve.url

    let pdfBuffer = await request.get({uri: remotePDFURL, encoding: null});
        
    fs.writeFileSync(newFilePath, pdfBuffer);

	let newFileDataBuffer = fs.readFileSync(newFilePath);

    pdf(newFileDataBuffer).then(function(data) 
	{
	    var newPDFHash = crypto.createHash('md5').update(data.text).digest('hex');

	    console.log("Old hash: " + oldPDFHash)
	    console.log("New hash: " + newPDFHash)

	    if (newPDFHash === oldPDFHash)
	    {
			console.log("Hashes match");
			//Do nothing, hashes are the same, we are done here.
	    }
	    else
	    {
			console.log("Hashes do not match");

	    	//TODO: Insert the hash, etc. combination into database
			//TODO: Send notifications that hashes do not match
	    }
	});
}

//TODO: Pull out the list of pdf/hash, etc. from database

let pdfsToCompare = [{"hash":"262c87980f945f17d850e55439539499","url":"https://github.com/BruceBGordon/votedotorg-state-site-tracking/raw/Will-Scraping/src/scraper/remotePDF.pdf"},
					{"hash":"0761019b03c4a4e3de6fe2c398f0a2fc","url":"https://github.com/BruceBGordon/votedotorg-state-site-tracking/raw/Will-Scraping/src/scraper/remotePDF.pdf"}]

for (var i = 0; i < pdfsToCompare.length; ++i)
{
	let loopPDF = pdfsToCompare[i]
	comparePDFs(loopPDF)
}