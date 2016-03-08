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
                //if this content already in mongo, send the data to makeChart
                if (result.exists == true) {
                    Router.go('/viewTrack/' + result.hash);
                } else {
                    //if not in mongo, needs to be parsed
                    var hash = result.hash;
                    var xmlData = result.xmlData;
                    Meteor.call('parseAndOutput', xmlData, hash, function (err, result) {
                        Router.go('/viewTrack/' + result._id);
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