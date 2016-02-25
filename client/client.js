Template.dataInput.helpers({
    trackData: function () {

    }
});

Template.dataInput.events({
    'click #startGraph': function () {
        Meteor.call('parseXML', function (err, result) {

            var dataset = result.locations;
            dataset.pop(); // last location not needed for graphing

            makeGraph(dataset, result, "ElevVsTime");
            makeGraph(dataset, result, "ElevVsDist");
        });
    }
});


function makeGraph(dataset, result, type) {

    var padding = 20;
    var width = 600;
    var height = 200;

    var xScale = d3.scale.linear()
        .domain([0, type == "ElevVsTime" ? result.totalTime : result.totalDist])
        .range([padding, width - padding]);


    var yScale = d3.scale.linear()
        .domain([result.elevMin, result.elevMax])
        .range([height - padding, padding]);

    var svg = d3.select('#graphs')
        .append('svg')
        .attr('class', type)
        .attr('width', width)
        .attr('height', height);

    var lines = svg.selectAll('lines')
        .data(dataset)
        .enter()
        .append("line")
        .attr("x1", function (d) {
            return xScale(type == "ElevVsTime" ? d.currentTimeVal : d.currentDistVal);
        })
        .attr("y1", function (d) {
            return yScale(d.elev);
        })
        .attr("x2", function (d) {
            return xScale(type == "ElevVsTime" ? d.nextTimeVal : d.nextDistVal);
        })
        .attr("y2", function (d) {
            return yScale(d.nextElev);
        })
        .attr("stroke", "blue")
        .attr("stroke-width", 2);
}