//Render the line charts
function makeChart(trackObj, type, timeAmt) {

    //SETUP
    //render graphs based on window size
    if (window.innerWidth > 1200) {
        var paddingLeft = 75;
        var paddingRight = 5;
        var paddingTop = 30;
        var paddingBottom = 30;
        var width = 650;
        var height = 280;
        var vTickNum = 6;
    } else if (window.innerWidth > 768 && window.innerWidth <= 1200) {
        //        var padding = 45;
        var paddingLeft = 60;
        var paddingRight = 5;
        var paddingTop = 28;
        var paddingBottom = 28;
        var width = 500;
        var height = 250;
        var vTickNum = 4;
    } else if (window.innerWidth <= 768) {
        //        var padding = 40;
        var paddingLeft = 45;
        var paddingRight = 5;
        var paddingTop = 25;
        var paddingBottom = 25;
        var width = 350;
        var height = 200;
        var vTickNum = 3;
    }

    //use this for calc pos of tool tip text
    var ttipFactor = -1 * ((width - paddingLeft - paddingRight) / 50).toFixed(2);
    //END SETUP


    //RENDER GRAPHS

    //setup scales for mapping data to axes
    var xScale = d3.scale.linear()
        .domain([
            type == "ElevVsTime" ? 0 : 0,
            type == "ElevVsTime" ? trackObj.totalTime : trackObj.totalDist
        ])
        .range([paddingLeft, width - paddingRight]);

    var yScale = d3.scale.linear()
        .domain([trackObj.elevMin, trackObj.elevMax])
        .range([height - paddingBottom, paddingTop]);

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
        .attr('width', width)
        .attr('height', height);

    //create the clip path
    //this is what "reveals" the path
    chart.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr('x', paddingRight - width)
        .attr('y', 0)
        .transition()
        .delay(500)
        .duration(timeAmt || 5000)
        .ease('quad')
        .attr('x', paddingRight);

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
        .ticks(vTickNum)
        .tickFormat(function (d) {
            return d + "ft";
        });

    //add x-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (height - paddingBottom) + ")")
        .call(xAxis);

    //add y-axis
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + (paddingLeft) + ",0)")
        .call(yAxis);

    //add description text for chart
    chart.append('text')
        .attr('class', 'chartDescription')
        .attr('x', (width - paddingRight))
        .attr('y', paddingTop)
        .attr('dy', '.7em')
        .attr('text-anchor', 'end')
        .text(type == "ElevVsTime" ? "Elevation Vs Time" : "Elevation Vs Distance");

    //get index of max elevation location
    var emIndex = trackObj.elevMaxIndex;

    if (type == "ElevVsTime") {
        var ttInitX = xScale(trackObj.locations[emIndex].timeProgress);
        var ttInitY = yScale(trackObj.locations[emIndex].elev);
    } else {
        var ttInitX = xScale(trackObj.locations[emIndex].currentDistVal);
        var ttInitY = yScale(trackObj.locations[emIndex].elev);
    }

    //add "tooltip" line
    var ttLine = chart.append('line')
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr('fill', 'none')
        .style("visibility", "hidden");

    //add circle marker for tooltip
    var marker = chart.append('circle')
        .attr('r', 4)
        .attr('fill', 'red')
        .style("visibility", "hidden");

    //add marker text for tooltip
    var markerText = chart.append('text')
        .attr("id", "markerText")
        .style("visibility", "hidden");

    //add "empty" rect for mouseover/tooltip
    chart.append("rect")
        .attr("fill-opacity", 0)
        .attr("width", width)
        .attr("height", height)
        //HANDLE MOUSEOVER
        .on("mousemove", function () {

            //bisector functions return index of where something would go in array
            //using it to lookup position in locations array
            var bisectXaxis = d3.bisector(function (d) {
                return (type == "ElevVsTime" ? d.timeProgress : d.currentDistVal);
            }).left;

            //convert mouse x back to trackobj number
            var newX = xScale.invert(d3.mouse(this)[0]);

            //find where "new" x is in the original array
            var index = bisectXaxis(trackObj.locations, newX);

            //set vars for mouse position
            var mouseX = d3.mouse(this)[0];
            var mouseY = d3.mouse(this)[1];

            //establish bounds for tooltip display
            if (mouseX >= paddingLeft &&
                mouseX <= width - paddingRight &&
                mouseY >= paddingTop &&
                mouseY <= height - paddingBottom) {

                //modify vert line
                ttLine.attr('x1', d3.mouse(this)[0])
                    .attr('x2', d3.mouse(this)[0])
                    .attr('y1', yScale(trackObj.locations[index].elev))
                    .attr('y2', height - paddingBottom);

                //modify the circle
                marker.attr('cx', d3.mouse(this)[0])
                    .attr('cy', yScale(trackObj.locations[index].elev));

                //setup to position tooltip text
                //shifted right when on left side of chart
                //shifted left when on right side of chart
                var ttTextCalc = ((mouseX / ttipFactor));
                var ttTextTransform = "translate(" + ttTextCalc + ",-10)";

                //modify the text
                markerText.attr('x', d3.mouse(this)[0])
                    .attr('y', yScale(trackObj.locations[index].elev))
                    .attr("transform", ttTextTransform)
                    .text(trackObj.locations[index].elev.toFixed(0) + "ft");
            }
        });


    //BEGIN SVG--PNG TRANSFORMATION
    //only run this code when rendering elevation vs distance
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
            context.drawImage(image, -1 * (paddingLeft / 2), 0);

            //encode img data as png
            var canvasdata = canvas.toDataURL("image/png");

            //send this to server where it will get stored in mongo if necessary
            Meteor.call('storeImgData', canvasdata, trackObj._id);

        };
    }

    setTimeout(function () {
        ttLine.style("visibility", "visible")
            .attr('x1', ttInitX)
            .attr('x2', ttInitX)
            .attr('y1', ttInitY)
            .attr('y2', height - paddingBottom);
        
        marker.style("visibility", "visible")
            .attr('cx', ttInitX)
            .attr('cy', ttInitY);
        
        markerText.style("visibility", "visible")
            .attr('x', ttInitX)
            .attr('y', ttInitY)
            .attr("transform", 'translate(' + (ttInitX / ttipFactor) + ', -10)')
            .text(trackObj.locations[emIndex].elev.toFixed(0) + "ft");
    }, timeAmt + 1000)
}