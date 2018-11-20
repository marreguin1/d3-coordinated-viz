//wrapping everything in self-executing anonymous function to move variables to local scope
(function () { //first line

    //pseudo-global variables
    var attrArray = ["AA_ODR", "AA_FullDR", "White", "Black", "Hispanic"]; // variable for data join
    var expressed = attrArray[0]; //initial attributes

    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a scale to size bars proportionally to frame
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 110]);


    //begin running script when the window loads
    window.onload = setMap();

    //set up choropleth map
    function setMap() {

        //map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        //create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        //create Albers equal area conic projection centered on the USA
        var projection = d3.geoAlbers()
            .center([0, 37.0902])
            .rotate([100, 0, 0])
            .parallels([43, 62])
            .scale(800)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);


        //use queue to parallelize asynchronous data loading
        d3.queue()
            .defer(d3.csv, "/data/opioidDataCopy.csv") //load attributes from csv
            .defer(d3.json, "/data/states3.topoJSON")
            .await(callback);


        function callback(error, csvData, states) {

            //place graticule on map
            setGraticule(map, path);

            //translate states topoJSONs
            var unitedStates = topojson.feature(states, states.objects.ne_10m_admin_1_states_provinces).features;

            //join csv data to GeoJSON enumeration units
            unitedStates = joinData(unitedStates, csvData);

            //create color scale
            var colorScale = makeColorScale(csvData);

            //add enumeration units to map
            setEnumerationUnits(unitedStates, map, path, colorScale);

            setChart(csvData, colorScale);

            createDropdown(csvData);

        }; //end of callback
    }; //end of setMap()

    //function to create dropdown menu for attr selection
    function createDropdown(csvData) {
        //add select element
        var dropdown = d3.select("body")
            .append("select")
            .attr("class", "dropdown")
            .on("change", function () {
                changeAttribute(this.value, csvData)
            });

        //add initial option
        var titleOption = dropdown.append("option")
            .attr("class", "titleOption")
            .attr("disabled", "true")
            .text("Select Attribute");

        //add attribute name options
        var attrOptions = dropdown.selectAll("attrOptions")
            .data(attrArray)
            .enter()
            .append("option")
            .attr("value", function (d) {
                return d
            })
            .text(function (d) {
                return d
            });
    };

    //dropdown change listener handle
    function changeAttribute(attribute, csvData) {
        //change the expressed attribute
        expressed = attribute;

        //recreate the color scale
        var colorScale = makeColorScale(csvData);

        //recolor enumeration units
        var states = d3.selectAll(".states")
            .transition()
            .duration(1000)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale)
            });

        //re-sort, resize, recolor bars
        var bars = d3.selectAll(".bars")
            //re-sort bars
            .sort(function (a, b) {
                return b[expressed] - a[expressed];
            });
        //.transition(); //add animation
        /*.delay(function (d, i) {
            return i * 20
        })
        .duration(500);*/

        updateChart(bars, csvData.length, colorScale);
    }; //end of changeAttribute

    function updateChart(bars, n, colorScale) {
        //position bars
        bars.attr("x", function (d, i) {
                return i * (chartInnerWidth / n) + leftPadding;
            })
            //size/resize bars
            .attr("height", function (d, i) {
                return 463 - yScale(parseFloat(d[expressed]));
            })
            .attr("y", function (d, i) {
                return yScale(parseFloat(d[expressed])) + topBottomPadding;
            })
            .transition()
            .delay(function (d, i) {
                return i * 20
            })
            .duration(500)
            //color/recolor bars
            .style("fill", function (d) {
                return choropleth(d, colorScale);
            })



        var chartTitle = d3.select(".chartTitle")
            .text("Number of Variable " + expressed[3] + " in each region");
    };

    //function to create color scale generator
    function makeColorScale(data) {
        var colorClasses = [
            "#D4B9DA",
            "#C994C7",
            "#DF65B0",
            "#DD1C77",
            "#980043"
        ];

        //create color scale generator
        var colorScale = d3.scaleQuantile()
            .range(colorClasses);

        //build array of all values of the expressed attributes
        var domainArray = [];
        for (var i = 0; i < data.length; i++) {
            var val = parseFloat(data[i][expressed]);
            domainArray.push(val);
        };

        //assign array of expressed values as scale domain
        colorScale.domain(domainArray);

        return colorScale;
    };

    //function to create coordinated bar chart
    function setChart(csvData, colorScale) {

        //create a second svg element to hold the bar chart
        var chart = d3.select("body")
            .append("svg")
            .attr("width", chartWidth)
            .attr("height", chartHeight)
            .attr("class", "chart");

        //create a rectangle for chart background fill
        var chartBackground = chart.append("rect")
            .attr("class", "chartBackground")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);


        //set bars for each state
        var bars = chart.selectAll(".bars")
            .data(csvData)
            .enter()
            .append("rect")
            .sort(function (a, b) {
                return b[expressed] - a[expressed]
            })
            .attr("class", function (d) {
                return "bars " + d.adm1_code;
            })
            .attr("width", chartInnerWidth / csvData.length - 1)
            //bars event listeners
            .on("mouseover", highlight)
            .on("mouseout", dehighlight)
            .on("mousemove", moveLabel);

        //add style descriptor to each rect
        var desc = bars.append("desc")
            .text('{"stroke": "none", "stroke-width": "0px"}');

        //chart title
        var chartTitle = chart.append("text")
            .attr("x", 40)
            .attr("y", 40)
            .attr("class", "chartTitle")
            .text("Opioid Death Rate Per 100,000 People By State 2016");

        //create vertical axis generator
        var yAxis = d3.axisLeft()
            .scale(yScale)
        //.orient("left");

        //place axis
        var axis = chart.append("g")
            .attr("class", "axis")
            .attr("transform", translate)
            .call(yAxis);

        //create frame for chart border
        var chartFrame = chart.append("rect")
            .attr("class", "chartFrame")
            .attr("width", chartInnerWidth)
            .attr("height", chartInnerHeight)
            .attr("transform", translate);

        updateChart(bars, csvData.length, colorScale);
    }; //end of setChart()

    function setGraticule(map, path) {
        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([15, 15]); //place graticule lines every 15 degrees of longitude and latitude

        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule

        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
    };

    function joinData(unitedStates, csvData) {
        //loop through csv to assign each set of csv attribute values to geojson state
        for (var i = 0; i < csvData.length; i++) {
            var csvRegion = csvData[i]; //the current state
            var csvKey = csvRegion.adm1_code; //the CSV primary key

            //loop through geojson states to find correct state
            for (var a = 0; a < unitedStates.length; a++) {

                var geojsonProps = unitedStates[a].properties; //the current state geojson properties
                var geojsonKey = geojsonProps.adm1_code; //the geojson primary key

                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey) {

                    //assign all attributes and values
                    attrArray.forEach(function (attr) {
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
        return unitedStates;
    };

    //function to create dynamic label
    function setLabel(props) {
        //label content
        var labelAttribute = "<h1>" + props[expressed] +
            "</h1><b>" + expressed + "</b>";

        //create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.adm1_code + "_label")
            .html(labelAttribute);

        var regionName = infolabel.append("div")
            .attr("class", "labelname")
            .html(props.name);
    };

    //highlight enumeration units and bars
    function highlight(props) {
        //change stroke
        var selected = d3.selectAll("." + props.adm1_code)
            .style("stroke", "blue")
            .style("stroke-width", "2");

        setLabel(props);
    };

    //function to reset the element style on mouseout
    function dehighlight(props) {
        var selected = d3.selectAll("." + props.adm1_code)
            .style("stroke", function () {
                return getStyle(this, "stroke")
            })
            .style("stroke-width", function () {
                return getStyle(this, "stroke-width")
            });

        function getStyle(element, styleName) {
            var styleText = d3.select(element)
                .select("desc")
                .text();

            var styleObject = JSON.parse(styleText);

            return styleObject[styleName];
        };

        // remove info label
        d3.select(".infolabel")
            .remove();
    };

    //function to move info label with mouse
    function moveLabel() {

        //get width of label
        var labelWidth = d3.select(".infolabel")
            .node()
            .getBoundingClientRect()
            .width;
        //use coordinates of mousemove event to set label coordinates
        var x1 = d3.event.clientX + 10,
            y1 = d3.event.clientY - 75,
            x2 = d3.event.clientX - labelWidth - 10,
            y2 = d3.event.clientY + 25;

        //horizontal label coordinate, testing for overflow
        var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1;
        //vertical label coordinate, testing for overflow
        var y = d3.event.clientY < 75 ? y2 : y1;

        d3.select(".infolabel")
            .style("left", x + "px")
            .style("top", y + "px");
    };

    function setEnumerationUnits(unitedStates, map, path, colorScale) {
        var states = map.selectAll(".states")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path)
            .style("fill", function (d) {
                return choropleth(d.properties, colorScale);
            })

            //states event listeners
            .on("mouseover", function (d) {
                highlight(d.properties);
            })
            .on("mouseout", function (d) {
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel)

            .on("mouseover", function (d) {
                highlight(d.properties);
            })
            .on("mouseout", function (d) {
                dehighlight(d.properties);
            });
        //add style descriptor to each path
        var desc = states.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');

        //examine the results console log
        console.log(unitedStates);
    };

    //test for data value and return color
    function choropleth(props, colorScale) {
        //make sure attr value is a number
        var val = parseFloat(props[expressed]);
        //if attr value exists, assign a color; otherwise  make it gray
        if (typeof val == 'number' && !isNaN(val)) {
            return colorScale(val);
        } else {
            return "#CCC";
        };
    };

})(); //last line
