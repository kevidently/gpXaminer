//IRON ROUTER
Router.route('/', {
    name: 'home',
    template: 'upload'
});

Router.route('/about');

Router.route('/gallery');

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