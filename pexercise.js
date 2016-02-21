if (Meteor.isClient) {

    Template.dataInput.helpers({
    });

    Template.dataInput.events({
        'click button': function () {
            Meteor.call('parseXML')
        }
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });

    Meteor.methods({
        parseXML: function () {
            
            //read text file from 'private' folder
            //file becomes string
            var file = Assets.getText('Humboldt.gpx');

            //split file-string on new lines
            var fileArr = file.split("\n");

            //setup flag vars for tracking location in file
            var trkFlag = false;
            var trkPtFlag = false;

            //setup obj to store track data
            var trackData = {
                name: '',
                desc: '',
                locations: [],
                totalDist: 0
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
                    var trkPtFlag = true;
                }

                //check for elevation
                var eleCheck = line.match(/^<ele>(.*)<\/ele>$/);
                if (eleCheck && trkPtFlag == true) {
                    locObj['elevation'] = eleCheck[1];
                }

                //check for timestamp
                //the ts is ISO formatted: 2015-05-25T15:58:18.608Z
                var tsCheck = line.match(/^<time>(\d+)-(\d+)-(\d+)T(\d+):(\d+):(\d+)\.(\d+)Z<\/time>$/);
                if (tsCheck && trkPtFlag == true) {
                    // 1=year, 2=month, 3=day, 4=hour, 5=min, 6=sec, 7=milsec  
                    var dateObj = new Date(tsCheck[1], tsCheck[2] - 1, tsCheck[3], tsCheck[4], tsCheck[5], tsCheck[6], tsCheck[7]);
                    locObj['timestamp'] = dateObj.getTime();
                }


                //check if we are done with "trkpt"
                if (line.match(/^<\/trkpt>$/)) {
                    //push location data to array of locations
                    trackData['locations'].push(locObj);
                    var trkPtFlag = false;
                }
            }


            //calc dist between locations
            for (var i = 0; i < trackData.locations.length; i++) {

                //need the "i+1" index in the array
                var j = i + 1;

                if (trackData.locations[j]) {
                    //setup coordinates
                    var lat1 = trackData.locations[i].lat;
                    var lon1 = trackData.locations[i].lon;
                    var lat2 = trackData.locations[j].lat;
                    var lon2 = trackData.locations[j].lon;

                    var dist = distBtwnPoints(lat1, lon1, lat2, lon2);

                    console.log("dist between " + i + " and " + j + " is " + dist);
                    trackData.totalDist += dist;
                }
            }
            console.log("This track covers about " + parseFloat(trackData.totalDist * 0.621371).toFixed(2) + " miles");


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
        }
    });


}