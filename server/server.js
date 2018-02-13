Meteor.startup(function () {
	//Tracks.remove({});
	if (Tracks.find().count() === 0) {
		console.log("Tracks collection is empty");
	}
});

//needed for routing
Meteor.publish('tracks', function () {
	return Tracks.find();
});

Meteor.methods({
	randBGImg: function () {
		//generate a random bg image
		var fs = Npm.require('fs');
		var meteorRoot = fs.realpathSync( process.cwd() + '/../' );
		var publicPath = meteorRoot + '/web.browser/app/';   
		var dirFiles = fs.readdirSync(publicPath +'bgImgs/');
		var rand = Math.floor(Math.random()*dirFiles.length);
		return dirFiles[rand];
	},
	fileUpload: function (fileData) {
		
		//create md5 checksum of file
		var crypto = Npm.require('crypto');

		function checksum(str, algorithm, encoding) {
			return crypto
				.createHash(algorithm || 'md5')
				.update(str, 'utf8')
				.digest(encoding || 'hex')
		}

		var hashedFile = checksum(fileData);

		//check if this track has already been processed
		var trackCheck = Tracks.findOne({
			_id: hashedFile
		});
		if (trackCheck) {
			//track exists in mongo
			return {
				exists: true,
				hash: hashedFile,
				jsonData: trackCheck
			}
		} else {
			//track does not exist in mongo
			return {
				exists: false,
				hash: hashedFile,
				fileData: fileData
			}
		}
	},
	storeImgData: function (imgTag, trackId) {
		var trackData = Tracks.findOne({
				_id: trackId
			})
		if (!trackData.imgTag) {
			Tracks.update(
			   { _id: trackId }, {$set: {imgTag: imgTag}}
			);
		}
	},
	analyzeAndOutput: function (trackData) {

		//go through array of location objects
		//calculate deltas for elevation, time, and dist between locations
		for (var i = 0; i < trackData.locations.length; i++) {

			//need the "i+1" index in the array
			var j = i + 1;

			if (trackData.locations[j]) { // if there's a "next" location

				//distance deltas
				//setup coordinates
				var deltaDist = distBtwnPoints(
					trackData.locations[i].lat,
					trackData.locations[i].lon,
					trackData.locations[j].lat,
					trackData.locations[j].lon
				);

				//UNIT CONVERSION
				deltaDist = deltaDist * 0.621; //Km to miles

				trackData.locations[i].currentDistVal = trackData.totalDist;
				trackData.totalDist += deltaDist;
				trackData.locations[i].nextDistVal = trackData.totalDist;

				//get elev delta with next location -- need for graphing
				trackData.locations[i].nextElev = trackData.locations[j].elev;

				//get time delta with next location -- need for graphing  
				var deltaTime = trackData.locations[j].timestamp - trackData.locations[i].timestamp;

				//UNIT CONVERSION
				deltaTime = ((deltaTime / 60000) / 60); //Milsec to hrs

				trackData.locations[i].timeProgress = trackData.totalTime
				trackData.totalTime += deltaTime;
			}

			//find max elev -- for axis domain
			if (trackData.locations[i].elev > trackData.elevMax) {
				trackData.elevMax = trackData.locations[i].elev;
				trackData.elevMaxIndex = i;
			}

			//find min elev -- for axis domain
			if (trackData.locations[i].elev < trackData.elevMin) {
				trackData.elevMin = trackData.locations[i].elev;
			}

		}

		//function to calculate distance between two points
		//found here:  http://jsperf.com/haversine-salvador/27
		function distBtwnPoints(lat1, lon1, lat2, lon2) {
			var deg2rad = 0.017453292519943295; // === Math.PI / 180
			var cos = Math.cos;
			lat1 *= deg2rad;
			lon1 *= deg2rad;
			lat2 *= deg2rad;
			lon2 *= deg2rad;
			var a = (
				(1 - cos(lat2 - lat1)) +
				(1 - cos(lon2 - lon1)) * cos(lat1) * cos(lat2)
			) / 2;

			return 12742 * Math.asin(Math.sqrt(a)); // Diameter of the earth in km (2 * 6371)
		}

		// Store data in mongo and return data to client
		if ( !Tracks.findOne( { _id: trackData._id } ) ) {
			Tracks.insert(trackData);
		}
		
		return trackData;
	}
});
