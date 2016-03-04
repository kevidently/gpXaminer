Tracks = new Meteor.Collection('tracks', function () {
    Session.set('colReady', true);
    return this.ready();    
});