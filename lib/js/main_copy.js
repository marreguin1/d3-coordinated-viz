//wrapping everything in self-executing anonymous function to move variables to local scope
(function(){ //first line

//pseudo-global variables
var attrArray = ["AA_ODR", "AA_FullDR", "PercChangeODR", "PercChangeFullDDR", "White", "Black", "Hispanic", "Total"]; // variable for data join
var expressed = attrArray[0];//initial attributes

//begin running script when the window loads
window.onload = setMap();

//set up choropleth map
function setMap() {

    //map frame dimensions
    var width = 960,
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
        .defer(d3.json, "/data/states3.topoJSON") //load background spatial data
        //decided not include more landmass for map
        //.defer(d3.json, "/data/land.topojson.json") //load background spatial data
        .await(callback);


    function callback(error, csvData, states) {
        
        //place graticule on map
        setGraticule(map, path);
        
        //translate states topoJSONs
        var unitedStates = topojson.feature(states, states.objects.ne_10m_admin_1_states_provinces).features;
        
        //join csv data to GeoJSON enumeration units
        unitedStates = joinData(unitedStates, csvData);
        
        //add enumeration units to map
        setEnumerationUnits(unitedStates, map, path);
        
        //create graticule generator
        //graticule block moved down
        /*var graticule = d3.geoGraticule()
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
            .attr("d", path); //project graticule lines*/
        //end of graticule block
        
        //moved up
        //translate states TopoJSON
        //var unitedStates = topojson.feature(states, states.objects.ne_10m_admin_1_states_provinces).features;

        //variables for data join moved to top of script
        //var attrArray = ["AA_ODR", "AA_FullDR", "PercChangeODR", "PercChangeFullDDR", "White", "Black", //"Hispanic", "Total"];
        
        //moved down
        //loop through csv to assign each set of csv attribute values to geojson state
        /*for (var i = 0; i < csvData.length; i++) {
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
        };*/
        //end of join loops block

        //moved down
        /*var states = map.selectAll(".states")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path);*/

        //examine the results console log
        //console.log(unitedStates);
    }; //end of callback
}; //end of setMap()

function setGraticule(map, path){
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

function joinData(unitedStates, csvData){
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
    
function setEnumerationUnits(unitedStates, map, path){
        var states = map.selectAll(".states")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function (d) {
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path);

        //examine the results console log
        console.log(unitedStates);
};

})(); //last line