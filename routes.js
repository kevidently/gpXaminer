//IRON ROUTER
Router.route('/', {
    name: 'about',
    template: 'about',

    waitOn: function () {
        return Meteor.subscribe('tracks');
    },
    action: function () {
        
        if (this.ready) {
            console.log(this);
            
            
            this.render('about', {
                data: function () {
//                    console.log("All headers "+this);
                    var trackId = "09edac606e4bca27c98ac957404d9b10";
                    var trackObj = Tracks.findOne(trackId);
                    return trackObj;
                }
            });
        }
    }
});

Router.route('/upload', {
    name: 'upload',
    template: 'upload'    
});

Router.route('/gallery', {
    name: 'gallery',
    template: 'gallery'    
});

Router.route('/viewTrack/:_id', {
    name: 'viewTrack',
    template: 'viewTrack',
    waitOn: function () {
        return Meteor.subscribe('tracks');
    },
    action: function () {
        if (this.ready) {
            this.render('viewTrack', {
                data: function () {
                    var trackId = this.params._id;
                    var trackObj = Tracks.findOne(trackId);
                    return trackObj;
                }
            });
        }
    }
});

Router.onBeforeAction("loading");

Router.configure({
    layoutTemplate: 'main',
    notFoundTemplate: 'notFound',
    loadingTemplate: 'loading'
});