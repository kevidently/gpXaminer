//TEMPLATE ON-RENDERED FUNCTIONALITY
Template.viewTrack.onRendered(function () {    
    this.autorun(function () {
        var retrievedData = Template.currentData();
        retrievedData.locations.pop();
        document.getElementById("charts").innerHTML = "";
        makeChart(retrievedData, "ElevVsTime");
        makeChart(retrievedData, "ElevVsDist");
//        outputCharts(retrievedData, ["ElevVsTime", "ElevVsDist"]);
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
        var retrievedData = Template.currentData();
        retrievedData.locations.pop();
        document.getElementById("charts").innerHTML = "";
        makeChart(retrievedData, "ElevVsDist", 3000);
//        outputCharts(retrievedData, ["ElevVsDist",], 3000);
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
            var moveAmt = window.innerWidth - this.width;
            this.style.transform = 'translateX(' + moveAmt + 'px)';
        }
        //note, path needs to start with slash, bug in iron router?
        bgimg.src = '/bgImgs/'+result;        
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
        var fileInfo = event.currentTarget.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            var fileContent = reader.result;

            Meteor.call('fileUpload', fileContent, function (err, result) {
                //if this content already in mongo, send the data to makeChart
                if (result.exists == true) {
                    var mongoData = result.jsonData;
//                    outputCharts(result.jsonData, ["ElevVsTime", "ElevVsDist"]);                
                    // remove last loc, doesn't have "current distVal"
                    mongoData.locations.pop();
                    document.getElementById("charts").innerHTML = "";
                    makeChart(mongoData, "ElevVsTime");
                    makeChart(mongoData, "ElevVsDist");
                } else {
                    //if not in mongo, needs to be parsed
                    var hash = result.hash;
                    var xmlData = result.xmlData;
                    Meteor.call('parseAndOutput', xmlData, hash, function (err, result) {
                        // remove last loc, doesn't have "current distVal"
                        result.locations.pop();
                        document.getElementById("charts").innerHTML = "";
                        makeChart(result, "ElevVsTime");
                        makeChart(result, "ElevVsDist");
//                        outputCharts(result, ["ElevVsTime", "ElevVsDist"]);
                    });
                }
            });

        };
        //this triggers the reader.onload step above
        //we don't really do anything with it
        reader.readAsText(fileInfo);
    }
});



//LOOSE FUNCTIONS

//Update borders on nav links
function updateNav(routeName) {
    $('.navLink').css('border', '0px');
    $('#nav_' + routeName).css('border-top', '2px solid #fbc901');
    $('#nav_' + routeName).css('border-bottom', '2px solid #fbc901');
}

//Make Chart Wrapper
function outputCharts (trackObj, types, duration) {
    // remove last loc, doesn't have "current distVal"
    trackObj.locations.pop();
    document.getElementById("charts").innerHTML = "";
    for (var i in types) {
        duration ? makeChart(trackObj, types[i], duration) : makeChart(trackObj, types[i])
        
//        if (duration) {
//            makeChart(trackObj, types[i], duration);
//        } else {
//            makeChart(trackObj, types[i]);    
//        }
    }
}

