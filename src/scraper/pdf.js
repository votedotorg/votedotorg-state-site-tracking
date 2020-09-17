const fs = require('fs');
const pdf = require('pdf-parse');
 
var http = require("http");
var path = require('path');
require('colors');
var jsdiff = require('diff');
var request = require('request');

http.createServer(function (request, response) 
{
   // Send the HTTP header 
   // HTTP Status: 200 : OK
   // Content Type: text/plain
   	response.writeHead(200, {'Content-Type': 'text/plain'});
   
   	const fs = require('fs');
	const pdf = require('pdf-parse');
	 
	let oldFilePath = path.resolve( __dirname, "sample.pdf")
	let newFilePath = path.resolve( __dirname, "sample-changes-different.pdf")

	let oldFileDataBuffer = fs.readFileSync(oldFilePath);
	let newFileDataBuffer = fs.readFileSync(newFilePath);

	pdf(oldFileDataBuffer).then(function(data) 
	{
	    let oldPDFText = data.text;

	    pdf(newFileDataBuffer).then(function(data) 
		{
		    let newPDFText = data.text;

		    if (newPDFText === oldPDFText)
		    {
		    	console.log('PDF text is the same!');
		    }
		    else
		    {
		    	console.log('PDF text is different!');
		    	var diff = jsdiff.diffChars(oldPDFText, newPDFText);
 
 				var completeDiffString = null;

				diff.forEach(function(part){
				  // green for additions, red for deletions
				  // grey for common parts
				  var color = part.added ? 'green' :
				    part.removed ? 'red' : 'grey';
				  completeDiffString = completeDiffString + part.value[color];
				});
				 
				console.log(completeDiffString);
				response.end(completeDiffString);
		    }
		});
	});
}).listen(8081);

console.log('Server running at http://127.0.0.1:8081/');
