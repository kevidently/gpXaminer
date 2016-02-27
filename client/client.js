Template.dataInput.events({
    'change #fileUpload': function (event) {
        var fileInfo = event.currentTarget.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            Meteor.call('fileUpload', fileInfo.name, reader.result);
            Meteor.call('parseAndOutput', reader.result, function (err, result) {
                var dataset = result.locations;
                dataset.pop(); // remove last loc, doesn't have "current distVal"
                document.getElementById("charts").innerHTML = "";
                makeChart(dataset, result, "ElevVsTime");
                makeChart(dataset, result, "ElevVsDist");
            });
        };
        reader.readAsText(fileInfo);
    }
});

function makeChart(dataset, result, type) {
    var padding = 40;
    var width = 700;
    var height = 300;

    var xScale = d3.scale.linear()
        .domain([
            type == "ElevVsTime" ? 0 : 0,
            type == "ElevVsTime" ? result.totalTime : result.totalDist
        ])
        .range([padding, width - padding]);

    var yScale = d3.scale.linear()
        .domain([result.elevMin, result.elevMax])
        .range([height - padding, padding]);

    //create line function
    var line = d3.svg.line()
        .x(function (d) {
            return xScale(type == "ElevVsTime" ? d.timeProgress : d.currentDistVal);
        })
        .y(function (d) {
            return yScale(d.elev);
        })

    //add SVG
    var chart = d3.select("#charts").append('svg')
        .attr('id', type)
        .attr('width', width)
        .attr('height', height);

    //add the clip path
    chart.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    //appending path element
    chart.append("path")
        .attr("d", line(dataset))
        .attr("stroke", "blue")
        .attr("stroke-width", 2)
        .attr("fill", "none")
        .attr('clip-path', 'url(#clip)');


    //add "curtain" rect for reveal effect
    chart.append('rect')
        .attr('x', padding)
        .attr('y', 0)
        .attr('height', height)
        .attr('width', width)
        .style('fill', '#ffffff')
        .transition()
        .delay(500)
        .duration(5000)
        .ease('quad')
        .attr('x', width)


    //create xAxis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(6)
        .tickFormat(
            type == "ElevVsTime" ?
            function (d) {
                return ((d/60000)/60).toFixed()+"h"
            } :
            function (d) {
                return d + "km";
            }
        );

    //add the x-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(xAxis);

    //create yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(6)
        .tickFormat(function (d) {
            return d + "m"
        });

    //add y-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (padding) + ",0)")
        .call(yAxis);
}