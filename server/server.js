Meteor.startup(function () {
    // code to run on server at startup
});

Meteor.methods({
    fileUpload: function (fileName, fileData) {
        var fs = Npm.require('fs');
        fs.writeFile(process.env.PWD + "/uploads/" + fileName, fileData);
    },
    parseAndOutput: function (fileData) {

        //read text file from 'private' folder
        //file becomes string
        //var file = Assets.getText('Humboldt.gpx');

        //split file-string on new lines
        //var fileArr = file.split("\n");
        var fileArr = fileData.split("\n");

        //setup obj to store track data
        var trackData = {
            name: '',
            desc: '',
            locations: [],
            totalDist: 0,
            tsMax: -Infinity,
            tsMin: Infinity,
            elevMax: -Infinity,
            elevMin: Infinity,
        };

        //go through file array content
        //manipulate data and store in object
        for (var i in fileArr) {

            //address one "line" in the file
            var line = fileArr[i];

            //check if we are in "trk"
            if (line.match(/^<trk>$/)) {
                var trkFlag = true;
            }

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
                locObj['elev'] = eleCheck[1];
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

                //calculate distance deltas
                //setup coordinates
                var lat1 = trackData.locations[i].lat;
                var lon1 = trackData.locations[i].lon;
                var lat2 = trackData.locations[j].lat;
                var lon2 = trackData.locations[j].lon;

                var deltaDist = distBtwnPoints(lat1, lon1, lat2, lon2);

                trackData.locations[i].currentDistVal = trackData.totalDist;
                trackData.totalDist += deltaDist;
                trackData.locations[i].nextDistVal = trackData.totalDist;

                //get elev delta with next location -- need for graphing
                trackData.locations[i].nextElev = trackData.locations[j].elev;

                //get time delta with next location -- need for graphing
                trackData.locations[i].nextTime = trackData.locations[j].timestamp;

            }

            //find max timestamp -- for axis domain
            if (trackData.locations[i].timestamp > trackData.tsMax) {
                trackData.tsMax = trackData.locations[i].timestamp;
            }

            //find min timestamp -- for axis domain
            if (trackData.locations[i].timestamp < trackData.tsMin) {
                trackData.tsMin = trackData.locations[i].timestamp;
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

//        trackData.elevRange = trackData.elevMax - trackData.elevMin;

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

        //send data to client
        return trackData;
    }
});