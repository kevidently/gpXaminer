//ROUTES
Router.route('/', {
    name: 'home',
    template: 'upload'
});

Router.route('/about');

Router.route('/gallery');

Router.route('/viewTrack/:_id', function () {
    this.render('viewTrack', {
        data: function () {
            var track = Tracks.findOne({
                _id: this.params._id
            });
            console.log(track);
            if (track) {
                return track;
            }
        }
    });
});



//KEEPING THIS FOR TESTING PURPOSES
//Router.route('/viewTrack/:_id', {
//    name: 'viewTrack',
//    template: 'viewTrack',
//    data: function () {
//        var trackId = this.params._id;
//        var track = Tracks.findOne({
//            _id: trackId
//        });
//        console.log(track);
//        
//        return track;
////        track.locations.pop();
////        document.getElementById("charts").innerHTML = "";
////        makeChart(track, "ElevVsTime");
////        makeChart(track, "ElevVsDist");
//    }
//});


Router.configure({
    layoutTemplate: 'main'
});