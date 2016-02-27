//Template.dataInput.helpers({

//});

Template.dataInput.events({
    'change #fileUpload': function (event) {
        var fileInfo = event.currentTarget.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            Meteor.call('fileUpload', fileInfo.name, reader.result);
            Meteor.call('parseAndOutput', reader.result, function (err, result) {
                var dataset = result.locations;
                dataset.pop(); // last location not needed for graphing
                document.getElementById("graphs").innerHTML = "";
                makeGraph(dataset, result, "ElevVsTime");
                makeGraph(dataset, result, "ElevVsDist");
            });
        };
        reader.readAsText(fileInfo);
    }
});



function makeGraph(dataset, result, type) {
    var padding = 40;
    var width = 600;
    var height = 200;

    var xScale = d3.scale.linear()
        .domain([
            type == "ElevVsTime" ? result.tsMin : 0,
            type == "ElevVsTime" ? result.tsMax : result.totalDist
        ])
        .range([padding, width - padding]);

    var yScale = d3.scale.linear()
        .domain([result.elevMin, result.elevMax])
        .range([height - padding, padding]);

    var svg = d3.select('#graphs')
        .append('svg')
        .attr('id', type)
        .attr('width', width)
        .attr('height', height);

    var lines = svg.selectAll('lines')
        .data(dataset)
        .enter()
        .append("line")
        .attr("x1", function (d) {
            return xScale(type == "ElevVsTime" ? d.timestamp : d.currentDistVal);
        })
        .attr("y1", function (d) {
            return yScale(d.elev);
        })
        //        .attr("x2", function (d) {
        //            return xScale(type == "ElevVsTime" ? d.timestamp : d.currentDistVal);
        //        })
        //        .attr("y2", function (d) {
        //            return yScale(d.elev);
        //        })
        //        .transition()
        //        .duration(1000)
        .attr("x2", function (d) {
            return xScale(type == "ElevVsTime" ? d.nextTime : d.nextDistVal);
        })
        .attr("y2", function (d) {
            return yScale(d.nextElev);
        })
        .attr("stroke", "blue")
        .attr("stroke-width", 2);

    // Add the clip path.
//    svg.append("clipPath")
//        .attr("id", "clip")
//        .append("rect")
//        .attr("width", width)
//        .attr("height", height);



    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(8)
        .tickFormat(
            type == "ElevVsTime" ?
            function (d) {
                var hms = d3.time.format("%X");
                return hms(new Date(d));
            } :
            function (d) {
                return d + "km";
            }
        );

    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(5)
        .tickFormat(function (d) {
            return d + "m"
        });

    /* Add 'curtain' rectangle to hide entire graph */
//    svg.append('rect')
//        .attr('x', -1 * width)
//        .attr('y', -1 * height)
//        .attr('height', height)
//        .attr('width', width)
//        .style('fill', '#ffffff')
//        .transition()
//        .delay(750)
//        .duration(4000)
//        .attr('width', 0)
//        .attr('class', 'curtain')
//        .attr('transform', 'rotate(180)')

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (padding) + ",0)")
        .call(yAxis);

//    var t = svg.transition()
//        .delay(750)
//        .duration(6000)
//        .ease('linear')
////        .each('end', function () {
////            d3.select('line.guide')
////                .transition()
////                .style('opacity', 0)
////                .remove()
////        });
//
//    t.select('rect.curtain')
//        .attr('width', 0);



}