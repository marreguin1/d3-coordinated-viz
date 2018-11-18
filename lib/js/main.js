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
        .defer(d3.csv,"/data/opioidDataCopy.csv") //load attributes from csv
        .defer(d3.json,"/data/states3.topoJSON") //load background spatial data
        //decided not include more landmass for map
        //.defer(d3.json, "/data/land.topojson.json") //load background spatial data
        .await(callback);

    
    function callback(error, csvData, states){
        
        //create graticule generator
        var graticule = d3.geoGraticule()
            .step([15, 15]); //place graticule lines every 5 degrees of longitude and latitude
        
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
        
        //translate states TopoJSON
        var unitedStates = topojson.feature(states, states.objects.ne_10m_admin_1_states_provinces).features
        
        var states = map.selectAll(".states")
            .data(unitedStates)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "states " + d.properties.adm1_code;
            })
            .attr("d", path);

        //examine the results
        //console.log(unitedStates);
    };
}
