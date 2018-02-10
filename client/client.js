//TEMPLATE ON-RENDERED FUNCTIONALITY
Template.viewTrack.onRendered(function () {
	this.autorun(function () {
		var trackData = Template.currentData();
		outputCharts(trackData, ["ElevVsTime", "ElevVsDist"], 4000);
	});
	//hard-coding this value, route name is not gallery but need to use something
	updateNav('gallery');
});

//using several of these template onrendered's to update navbar links
Template.gallery.onRendered(function () {
	updateNav(Router.current().route.getName());
});

Template.upload.onRendered(function () {
	updateNav(Router.current().route.getName());
});

Template.about.onRendered(function () {
	this.autorun(function () {
		var trackData = Template.currentData();
		outputCharts(trackData, ["ElevVsDist", ], 3000);
	});
	updateNav(Router.current().route.getName());
});

Template.main.onRendered(function () {
	//add random background image

	Meteor.call('randBGImg', function (err, result) {
		if (err) {
			console.log(err);
		}

		//use img onload to animate
		//issue with getting width of img not being ready
		var bgimg = $('#bgImage')[0];
		bgimg.onload = function () {
			//triggers animaion of background
			var moveAmt = window.innerWidth - this.width;
			this.style.transform = 'translateX(' + moveAmt + 'px)';
		};
		//note, path needs to start with slash, bug in iron router?
		bgimg.src = '/bgImgs/' + result;
	});
});

//TEMPLATE HELPERS
Template.gallery.helpers({
	tracks: function () {
		return Tracks.find().fetch();
	}
});

//TEMPLATE EVENTS
Template.upload.events({
	'mousedown #uploadBtnHolder': function (event) {
		$('#uploadBtnHolder').css('transform', 'scale(.9,.9)');
		$('#uploadBtnHolder').css('text-shadow', '0px 0px 0px black');
		setTimeout(function () {
			$('#uploadBtnHolder').css('transform', 'scale(1,1)');
			$('#uploadBtnHolder').css('text-shadow', '3px 3px 2px black');
		}, 40);
	},
	'mouseup #uploadBtnHolder': function (event) {
		$('#fileUpload').trigger('click');
	},
	'change #fileUpload': function (event) {
		$('#uploadBtnHolder').css('display', 'none');
		$('#uploadContent').css('display', 'none');
		var fileInfo = event.currentTarget.files[0];
		var reader = new FileReader();

		reader.onload = function (event) {
			var fileContent = reader.result;

			Meteor.call('fileUpload', fileContent, function (err, result) {
				// If this content already in mongo, send the data to makeChart
				if (result.exists == true) {
					Router.go('/viewTrack/' + result.hash);
				} else {
					// If not in mongo, needs to be parsed and then analyzed
					
					// Although it would be good to do the majority of this on the server,
					// it seems NodeJS does not offer 'DOMParser', etc
					
					var hash = result.hash;
					var fileData = result.fileData;
					
					// Create an xml doc from filedata
					var dp = new DOMParser();
					var xmlDoc = dp.parseFromString(fileData, "application/xml");
					
					// Setup object to store data for this track
					var trackData = {
						_id: hash, // becomes mongo id
						name: '',
						desc: '',
						locations: [],
						totalDist: 0,
						totalTime: 0,
						elevMax: -Infinity,
						elevMin: Infinity,
						elevMaxIndex: 0
					};

					var nsResolver = function (prefix) {
						return prefix === "g" ? "http://www.topografix.com/GPX/1/1" : null;
					}

					// Start xpath queries ('g:' is custom prefix for default namespace)

					// Get <name>
					var nameResult = document.evaluate("/g:gpx/g:trk/g:name", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null);
					trackData.name = nameResult.stringValue;

					// Get <desc>
					var descResult = document.evaluate("/g:gpx/g:trk/g:desc", xmlDoc, nsResolver, XPathResult.STRING_TYPE, null);
					trackData.desc = descResult.stringValue;

					var trkPtResult = document.evaluate("//g:trkpt", xmlDoc, nsResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);

					// Iterate all '<trkpt>' and gather info
					var trkPtNode;
					while (trkPtNode = trkPtResult.iterateNext()) {

						// Store info for this location
						var locObj = {};

						// Get lat and long
						var trkPtAttrs = trkPtNode.attributes;
						var latAttr = trkPtAttrs.getNamedItem("lat");
						var lonAttr = trkPtAttrs.getNamedItem("lon");

						// Get elevation and time
						var childNodes = trkPtNode.children;
						var elevation, timestamp;

						for ( var i in childNodes ) {
							var childNode = childNodes[i];
							if ( childNode.nodeName == "ele" ) {
								elevation = childNode.textContent;
							}
							if ( childNode.nodeName == "time" ) {
								timestamp = childNode.textContent;
							}
						}

						// Setting lat and long
						locObj.lat = latAttr.value;
						locObj.lon = lonAttr.value;

						// Setting elevation
						locObj.elev = elevation * 3.281; // conversion meters to feet

						// Setting timestamp
						// ISO 8601 formatted string: 2015-05-25T15:58:18.608Z (motionX)
						// variant seen in GaiaGPS: 2018-02-04T17:37:19Z
						var tmpDate = new Date(timestamp);
						locObj.timestamp = tmpDate.getTime();

						trackData.locations.push(locObj);
					}

					Meteor.call('analyzeAndOutput', trackData, function (err, result) {
						Router.go('/viewTrack/' + result._id);
					});
				}
			});
		};
		//this triggers the reader.onload step above
		reader.readAsText(fileInfo);
	}
});



//LOOSE FUNCTIONS

//re-animate bg image if window resize
window.onresize = function () {
	var bgimg = $('#bgImage')[0];
	var moveAmt = window.innerWidth - bgimg.width;

	//halt the transition
	bgimg.className = 'notransition';

	//re-position image
	bgimg.style.top = 0;
	bgimg.style.left = 0;
	bgimg.style.height = '100vh';
	bgimg.style.transform = 'translateX(0px)';

	//need to trigger a 'reflow' of css changes
	bgimg.offsetHeight; //'trigger a css reflow, flush css changes'

	//allow new transition to start
	bgimg.removeAttribute('class');

	//trigger animation
	bgimg.style.transform = 'translateX(' + moveAmt + 'px)';
};


//Update borders on nav links
function updateNav(routeName) {
	$('.navLink').css('border', '0px');
	$('#nav_' + routeName).css('border-top', '2px solid #fbc901');
	$('#nav_' + routeName).css('border-bottom', '2px solid #fbc901');
}

//Wrapper for "Make Chart"
function outputCharts(trackObj, types, duration) {
	// remove last loc, doesn't have "current distVal"
	trackObj.locations.pop();
	document.getElementById("charts").innerHTML = "";
	for (var i in types) {
		duration ? makeChart(trackObj, types[i], duration) : makeChart(trackObj, types[i])
	}
}