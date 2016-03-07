//Render the line charts
function makeChart(trackObj, type, timeAmt) {
    var padding = 50;
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
        .range([height - padding, (padding - 20)]);

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
        .attr('class', "svgChart")
        .attr('width', width - (padding - 5))
        .attr('height', height - (padding - 20));

    //create the clip path
    //this is what "reveals" the path
    chart.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr('x', padding - width)
        .attr('y', 0)
        .transition()
        .delay(500)
        .duration(timeAmt || 5000)
        .ease('quad')
        .attr('x', padding);

    //add path
    chart.append("path")
        .attr("d", line(trackObj.locations))
        .attr("stroke", "#fbc901")
        .attr("stroke-width", 3)
        .attr("fill", "none")
        .attr('clip-path', 'url(#clip)');

    //create xAxis
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(6)
        .tickFormat(
            type == "ElevVsTime" ?
            function (d) {
                return d.toFixed(1) + "h";
            } :
            function (d) {
                return d.toFixed(1) + "mi";
            }
        );

    //create yAxis
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(6)
        .tickFormat(function (d) {
            return d + "ft";
        });

    //add x-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height - padding) + ")")
        .call(xAxis);
    
    //add y-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (padding) + ",0)")
        .call(yAxis);
    
    //add description text for chart
    chart.append('text')
        .attr('class', 'chartDescription')  
        .attr('x', (width - padding))
        .attr('y', padding - 10)
        .attr('text-anchor', 'end')
//        .attr("transform", mText)
        .text(type == "ElevVsTime" ? "Elevation Vs Time" : "Elevation Vs Distance");
//        .style("visibility", "hidden");
    

    //add "tooltip" line
    var ttLine = chart.append('line')
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr('fill', 'none')
        .style("visibility", "hidden");

    //add marker for tooltip
    var marker = chart.append('circle')
        .attr('r', 5)
        .attr('fill', 'red')
        .style("visibility", "hidden");

    //add marker text for tooltip
    var markerText = chart.append('text')
        .attr("id", "markerText")
        .style("visibility", "hidden");


    //bisector function returns index of where something would go in array
    //using it to lookup position in locaitns array and get y/elev value
    var bisectXaxis = d3.bisector(function (d) {
        return (type == "ElevVsTime" ? d.timeProgress : d.currentDistVal);
    }).left;

    //add "empty" rect for mouseover/tooltip
    chart.append("rect")
        .attr("fill-opacity", 0)
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", function () {

            //convert mouse x back to trackobj number
            var newX = xScale.invert(d3.mouse(this)[0]);

            //find where "new" x is in the original array
            var index = bisectXaxis(trackObj.locations, newX);

            //set vars for mouse position
            var mouseX = d3.mouse(this)[0];
            var mouseY = d3.mouse(this)[1];

            //establish bounds for tooltip display
            if (mouseX >= padding &&
                mouseX <= width - (padding + 1) &&
                mouseY >= padding - 15 &&
                mouseY <= height - padding) {

                //position tooltip text
                //shifted right when on left side of chart
                //shifted left when on right side of chart
                var mmText = ((mouseX / -12.98) + 10);
                var mText = "translate(" + mmText + ",-20)";

                //modify vert line
                ttLine.style("visibility", "visible");
                ttLine.attr('x1', d3.mouse(this)[0]);
                ttLine.attr('x2', d3.mouse(this)[0]);
                ttLine.attr('y1', yScale(trackObj.locations[index].elev));
                ttLine.attr('y2', height - padding);

                //modify the square
                marker.style("visibility", "visible");
                marker.attr('cx', d3.mouse(this)[0]);
                marker.attr('cy', yScale(trackObj.locations[index].elev));

                //modify the text
                markerText.style("visibility", "visible");
                markerText.attr('x', d3.mouse(this)[0]);
                markerText.attr('y', yScale(trackObj.locations[index].elev));
                markerText.attr("transform", mText);
                markerText.text(trackObj.locations[index].elev.toFixed(0) + "ft");
            }
        });


    //BEGIN SVG--PNG TRANSFORMATION
    //only run this using elevation vs distance
    if (type == "ElevVsDist") {

        d3.select("#ElevVsDist")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")

        d3.select("#charts").append('canvas')
            .attr("id", "pngoutput")
            .attr("width", width)
            .attr("height", height)

        //cherry picking parts of svg we want for img output
        var svgData = d3.select("#ElevVsDist").node().outerHTML;
        var svgTag = svgData.match(/<svg[^>]*>/);
        var pathTag = svgData.match(/<path d=[^>]*><\/path>/);

        //final svgdata to feed into b64 and canvas
        var svgForImg = svgTag + pathTag + "</svg>"

        //base64 encode into an svg+xml img
        var svg_xml_img_src = 'data:image/svg+xml;base64,' + btoa(svgForImg);

        var canvas = document.querySelector("#pngoutput"),
            context = canvas.getContext("2d");

        //create new img for canvas
        var image = new Image;
        image.src = svg_xml_img_src;
        image.onload = function () {
            context.drawImage(image, 0, 0);

            //encode img data as png
            var canvasdata = canvas.toDataURL("image/png");

            //send this to server where it will get stored in mongo if necessary
            Meteor.call('storeImgData', canvasdata, trackObj._id);

        };
    }
}