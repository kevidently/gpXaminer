Meteor.startup(function () {
//        Tracks.remove({});
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
        var fs = Npm.require('fs');
        var dirFiles = fs.readdirSync(process.env.PWD+'/.meteor/local/build/programs/web.browser/app/bgImgs/');
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
                xmlData: fileData
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
    parseAndOutput: function (fileData, hash) {

        //split file data on new lines
        var fileArr = fileData.split("\n");

        //setup obj to store track data
        var trackData = {
            _id: hash, // becomes mongo id
            name: '',
            desc: '',
            locations: [],
            totalDist: 0,
            totalTime: 0,
            elevMax: -Infinity,
            elevMin: Infinity,
        };

        //go through file array content
        //manipulate data and store in object
        for (var i in fileArr) {

            //address one "line" in the file
            var line = fileArr[i];

            //check for name of track
            var nameCheck = line.match(/^<name>(.*)<\/name>$/);
            if (nameCheck) {
                trackData['name'] = nameCheck[1];
            }

            //check for desc of track
            var descCheck = line.match(/^<desc>(.*)<\/desc>$/);
            if (descCheck) {
                trackData['desc'] = descCheck[1];
            }

            //check if we are starting new "trkpt"
            //formatted like: <trkpt lat="39.9579604" lon="-105.3386374">
            var trkPtCheck = line.match(/^<trkpt lat="(.*)" lon="(.*)">$/);
            if (trkPtCheck) {
                var locObj = {
                    lat: trkPtCheck[1],
                    lon: trkPtCheck[2],
                }
            }

            //check for elevation
            var eleCheck = line.match(/^<ele>(.*)<\/ele>$/);
            if (eleCheck && locObj) {
                //UNIT CONVERSION
                locObj['elev'] = eleCheck[1] * 3.281; //in feet
            }

            //check for timestamp
            //the ts is ISO formatted: 2015-05-25T15:58:18.608Z
            var tsCheck = line.match(/^<time>(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z<\/time>$/);
            if (tsCheck && locObj) {
                // 1=year, 2=month, 3=day, 4=hour, 5=min, 6=sec, 7=milsec  
                var dateObj = new Date(tsCheck[1], tsCheck[2] - 1, tsCheck[3], tsCheck[4], tsCheck[5], tsCheck[6], tsCheck[7]);
                locObj['timestamp'] = dateObj.getTime();
            }


            //check if we are done with "trkpt"
            if (line.match(/^<\/trkpt>$/)) {
                //push location data to array of locations
                trackData['locations'].push(locObj);
            }
        }

        //go through array of location objects
        //calc deltas for elevation, time, and dist between locations
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

        //store data in mongo and return data to client
        if (Tracks.findOne({
                _id: hash
            })) {
            return trackData;
        } else {
            Tracks.insert(trackData);
            return trackData;
        }
    }
});