//KEEPING THIS FOR TESTING PURPOSES
//Template.viewTrack.onRendered(function () {
//    this.autorun(function () {
//
//        var retrievedData = Template.currentData();
//        console.log(retrievedData);
//
//        // remove last loc, doesn't have "current distVal"
//        retrievedData.locations.pop();
//        document.getElementById("charts").innerHTML = "";
//        makeChart(retrievedData, "ElevVsTime");
//        makeChart(retrievedData, "ElevVsDist");
//
//    });
//
//});

Template.viewTrack.helpers({
    renderD3: function () {
        if (this) {
            console.log(this);
            // remove last loc, doesn't have "current distVal"
            this.locations.pop();
            //        document.getElementById("charts").innerHTML = "";
            makeChart(this, "ElevVsTime");
            makeChart(this, "ElevVsDist");
            //        return;
        }
    }

})


Template.upload.events({
    'change #fileUpload': function (event) {
        var fileInfo = event.currentTarget.files[0];
        var reader = new FileReader();

        reader.onload = function (event) {
            var fileContent = reader.result;

            Meteor.call('fileUpload', fileContent, function (err, result) {
                //if this content already in mongo, send the data to makeChart
                if (result.exists == true) {
                    var mongoData = result.jsonData;
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
                    });
                }
            });

        };
        //this triggers the reader.onload step above
        //we don't really do anything with it
        reader.readAsText(fileInfo);
    }
});

function makeChart(trackObj, type) {
    var padding = 40;
    var width = 700;
    var height = 300;

    var xScale = d3.scale.linear()
        .domain([
            type == "ElevVsTime" ? 0 : 0,
            type == "ElevVsTime" ? trackObj.totalTime : trackObj.totalDist
        ])
        .range([padding, width - padding]);

    var yScale = d3.scale.linear()
        .domain([trackObj.elevMin, trackObj.elevMax])
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
        .attr("d", line(trackObj.locations))
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
                return d.toFixed(1) + "h"
            } :
            function (d) {
                return d.toFixed(1) + "mi";
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
            return d + "ft";
        });

    //add y-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (padding) + ",0)")
        .call(yAxis);
}