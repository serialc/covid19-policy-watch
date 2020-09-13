"use strict";

var CPW = {
  "data": {},
  "constants": {
    "policy_colours": ["#e72f52", "#7dc462", "#0d95d0", "#774fa0", "#efb743", "#e72f52", "#ffa500", "#777777"],
    "urls": {
      "policies": {
        "live": "https://static.eurofound.europa.eu/covid19db/data/covid19db.json",
        "backup": "data/covid19db.json"
      },
      "rates": {
        "local": "data/covid19_infdth.json"
      }
    }
  }
};

CPW.initialize = function() {

  // build a list of the countries
  CPW.countries = CPW.get_countries();
  CPW.policy_types = CPW.get_policy_types();

  // generate the links to the countries
  CPW.create_links();

  // generate the infographics for all EU countries
  CPW.create_infographics();
};

CPW.create_links = function() {
  let countries = CPW.countries;
  let clist = document.getElementById("country_list");

  for( let i=0; i < countries.length; i=i+1 ) {
    // add country link to list
    let link = document.createElement("a");
    link.appendChild(document.createTextNode(countries[i]));
    link.setAttribute("href", "#" + countries[i]);
    clist.appendChild(link);
    if( (i+1) !== countries.length ) {
      clist.appendChild(document.createTextNode(", "));
    }
  }
};

CPW.create_infographics = function() {
  let countries = CPW.countries;
  let main = document.getElementById("main");
  // empty the main element
  main.innerHTML = '';

  // add headings for each country
  for( let i=0; i < countries.length; i=i+1 ) {
    //console.log(countries[i]);

    // add heading
    let heading = document.createElement("h2");
    let tnode = document.createTextNode(countries[i]);
    heading.setAttribute("id", countries[i]);
    heading.appendChild(tnode);

    main.appendChild(heading);

    let p = document.createElement("p");
    // add generated SVG
    p.appendChild(CPW.get_country_svg(i, countries[i]));
    main.appendChild(p);

    // info box
    p = document.createElement("p");
    p.setAttribute("id", "ib_" + i);
    main.appendChild(p);
    //break;
  }
};

CPW.get_country_svg = function(cid, country) {
  let canvas_width = 1000;
  let canvas_height = 200;
  let policy_height = 200;
  let padding = 2;
  let xmargin = 45;
  let ytmargin = 45;
  let ybmargin = padding + policy_height;
  let svgns = "http://www.w3.org/2000/svg";
  let font_size = 16;
  
  // create SVG element
  let svg = document.createElementNS(svgns, 'svg'); 
  svg.setAttribute("viewBox", -xmargin + " " + -ytmargin + " " + (canvas_width + 2 * xmargin) + " " + (canvas_height + ytmargin + ybmargin));

  // get data
  let dates = CPW.data.rates.inf[country].date;
  let inf_day = CPW.data.rates.inf[country]['daily'];
  let inf_smth = CPW.data.rates.inf[country]['smth7'];
  let dth_day = CPW.data.rates.dth[country]['daily'];
  let dth_smth = CPW.data.rates.dth[country]['smth7'];

  // calc. conversions
  let x_min = new Date(dates[0]);
  let x_max = new Date(dates[dates.length -1]);
  let days_of_data = (x_max - x_min)/(1000*24*60*60) + 1;
  let barw = (canvas_width -  padding)/days_of_data;
  let x_conv = (canvas_width - padding - barw) / (x_max - x_min)

  // some negative values, careful
  let max_inf = Math.max.apply(null, inf_day.map( v => Math.abs(v))); // similar to below, longhand
  //let max_inf = Math.max.apply(null, inf); // similar to above, shorthand
  
  let max_dth = Math.max.apply(null, dth_day.map( v => Math.abs(v))); // similar to below, longhand
  //let max_dth = Math.max(...dth); // similar to above, shorthand
  
  let inf_conv = max_inf/(canvas_height - 2 * padding);
  let dth_conv = max_dth/(canvas_height - 2 * padding);

  // make scale grid-lines
  let text_line_meet = 0;
  let text_y_shift = 5;

  // legend text
  let inf_text = document.createElementNS(svgns, 'text');
  inf_text.setAttribute("class", "inf_scale");
  inf_text.setAttribute("x", padding - xmargin);
  inf_text.setAttribute("y", padding - ytmargin + font_size);
  inf_text.appendChild(document.createTextNode("Confirmed cases"));
  svg.appendChild(inf_text);

  let dth_text = document.createElementNS(svgns, 'text');
  dth_text.setAttribute("class", "dth_scale");
  dth_text.setAttribute("text-anchor", "end");
  dth_text.setAttribute("x", canvas_width + xmargin - padding);
  dth_text.setAttribute("y", padding - ytmargin + font_size);
  dth_text.appendChild(document.createTextNode("Deaths"));
  svg.appendChild(dth_text);

  let pol_text = document.createElementNS(svgns, 'text');
  pol_text.setAttribute("class", "dth_scale");
  pol_text.setAttribute("text-anchor", "middle");
  pol_text.setAttribute("transform", "translate(" + -padding + "," + (canvas_height + policy_height/2) + "),rotate(-90)");
  pol_text.appendChild(document.createTextNode("Policy measures"));
  svg.appendChild(pol_text);

  // Add horizontal scale lines
  let inf_lines = 3;
  for( let i = 0; i <= inf_lines; i=i+1 ) {
    let rndnum = Math.round(max_inf/inf_lines*i);

    let inf_line = document.createElementNS(svgns, 'line');
    inf_line.setAttribute("class", "inf_scale");
    inf_line.setAttribute("x1", padding + text_line_meet);
    inf_line.setAttribute("x2", canvas_width - padding);
    inf_line.setAttribute("y1", rndnum/inf_conv + padding);
    inf_line.setAttribute("y2", rndnum/inf_conv + padding);
    svg.appendChild(inf_line);

    let inf_text = document.createElementNS(svgns, 'text');
    inf_text.setAttribute("class", "inf_scale");
    inf_text.setAttribute("text-anchor", "end");
    inf_text.setAttribute("x", text_line_meet - padding)
    inf_text.setAttribute("y", rndnum/inf_conv + text_y_shift + padding);
    inf_text.appendChild(document.createTextNode(Math.round(max_inf - rndnum)));
    svg.appendChild(inf_text);

  }

  if( max_dth > 0 ) {
    let dth_lines = 3;
    let last_rndnum = -1;
    for( let i = 0; i <= dth_lines; i=i+1 ) {
      let rndnum = Math.round(max_dth/dth_lines * i);

      // prevent lines from being drawn multiple times
      if( rndnum === last_rndnum ) {
        continue;
      }
      last_rndnum = rndnum;

      let line = document.createElementNS(svgns, 'line');
      line.setAttribute("class", "dth_scale");
      line.setAttribute("x1", padding);
      line.setAttribute("x2", canvas_width - padding - text_line_meet );
      line.setAttribute("y1", rndnum/dth_conv + padding);
      line.setAttribute("y2", rndnum/dth_conv + padding);
      svg.appendChild(line);

      let text = document.createElementNS(svgns, 'text');
      text.setAttribute("class", "dth_scale");
      text.setAttribute("text-anchor", "start");
      text.setAttribute("x", canvas_width - text_line_meet + padding)
      text.setAttribute("y", rndnum/dth_conv + text_y_shift + padding);
      text.appendChild(document.createTextNode((max_dth - rndnum)));
      svg.appendChild(text);
    }
  }

  // make data bars of inf and dth, and x-axis vertical grid/date lines
  // iterates through each day of data
  let inf_polyline_coords = '';
  let dth_polyline_coords = '';
  for( let i = 0; i < days_of_data; i=i+1 ) {

    let infdth_ttip = document.createElementNS(svgns, 'title');
    infdth_ttip.appendChild(document.createTextNode("Reported: " + inf_day[i] + " cases, " + dth_day[i] + " deaths\nDate: " + dates[i]))

    // draw the bar for each day's infections
    // infections/cases scale 
    if( inf_day[i] !== 0 ) {

      let inf_bar = document.createElementNS(svgns, 'rect');
      inf_bar.appendChild(infdth_ttip.cloneNode(true));
      inf_bar.setAttribute("width", barw - padding);
      // handle negative values
      if( inf_day[i] < 0 ) {
        inf_bar.setAttribute("class", "infnegbar");
        inf_bar.setAttribute("height", -1 * inf_day[i]/inf_conv);
        inf_bar.setAttribute("y", canvas_height - padding - inf_day[i]/inf_conv * -1);
      } else {
        inf_bar.setAttribute("class", "infbar");
        inf_bar.setAttribute("height", inf_day[i]/inf_conv);
        inf_bar.setAttribute("y", canvas_height - padding - inf_day[i]/inf_conv);
      }
      inf_bar.setAttribute("x", padding + (new Date(dates[i]) - x_min) * x_conv);
      svg.appendChild(inf_bar);
    }

    // draw the bar for each day's deaths 
    if( dth_day[i] !== 0 ) {

      let dth_bar = document.createElementNS(svgns, 'rect');
      dth_bar.appendChild(infdth_ttip);
      dth_bar.setAttribute("width", barw - padding);
      // handle negative values
      if( dth_day[i] < 0 ) {
        dth_bar.setAttribute("class", "dthnegbar");
        dth_bar.setAttribute("height", -1 * dth_day[i]/dth_conv);
        dth_bar.setAttribute("y", canvas_height - padding - dth_day[i]/dth_conv * -1);
      } else {
        dth_bar.setAttribute("class", "dthbar");
        dth_bar.setAttribute("height", dth_day[i]/dth_conv);
        dth_bar.setAttribute("y", canvas_height - padding - dth_day[i]/dth_conv);
      }
      dth_bar.setAttribute("x", padding + (new Date(dates[i]) - x_min) * x_conv);
      svg.appendChild(dth_bar);
    }

    // draw the line for the smoothed infections
    if( inf_smth[i] !== "NA" ) {
      inf_polyline_coords += 
        (padding + (new Date(dates[i]) - x_min) * x_conv) + ',' +
        (canvas_height - padding - inf_smth[i]/inf_conv) + ' ';
    }
    
    // draw the line for the smoothed infections
    if( dth_smth[i] !== "NA" ) {
      dth_polyline_coords += 
        (padding + (new Date(dates[i]) - x_min) * x_conv) + ',' +
        (canvas_height - padding - dth_smth[i]/dth_conv) + ' ';
    }

    // make vertical x-axis scale grid lines
    let dateparts = dates[i].split("-");
    if( dateparts[2] === "01" ) {
      let vgrid = document.createElementNS(svgns, 'line');
      let value = padding + (new Date(dates[i]) - x_min) * x_conv - padding/2;

      vgrid.setAttribute("class", "date_grid");
      vgrid.setAttribute("x1", value);
      vgrid.setAttribute("x2", value);
      vgrid.setAttribute("y1", padding);
      vgrid.setAttribute("y2", canvas_height + policy_height - padding);
      svg.appendChild(vgrid);

      let text = document.createElementNS(svgns, 'text');
      text.setAttribute("class", "dth_scale");
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("x", value);
      text.setAttribute("y", -padding);
      text.appendChild(document.createTextNode(parseInt(dateparts[1], 10) + "/" + dateparts[0]));
      svg.appendChild(text);
    }
  }

  // create smoothed lines
  let inf_line = document.createElementNS(svgns, 'polyline');
  inf_line.setAttribute("points", inf_polyline_coords);
  inf_line.setAttribute("class", "smooth_inf");
  svg.appendChild(inf_line);

  let dth_line = document.createElementNS(svgns, 'polyline');
  dth_line.setAttribute("points", dth_polyline_coords);
  dth_line.setAttribute("class", "smooth_dth");
  svg.appendChild(dth_line);

  // add policy bars
  let cpolicies = CPW.data.policies.filter(c => c.fieldData.calc_country === country);
  let pbar_width = (policy_height - padding)/cpolicies.length;

  //let pc = CPW.constants.policy_colours;
  let polycount = 0;
  for( let i in cpolicies ) {
    if( cpolicies[i] && typeof cpolicies !== 'function') {
      let cp = cpolicies[i];
      let url = cp.fieldData.calc_githubURL;
      let estart = Date.parse(Date.parse(cp.fieldData.d_startDate) < x_min ? x_min : cp.fieldData.d_startDate );
      let estop = Date.parse(cp.fieldData.d_endDate === "" || Date.parse(cp.fieldData.d_endDate) > x_max ? x_max : cp.fieldData.d_endDate );
      estop = estop + 24 * 60 * 60 * 1000; // end of day rather than start

      let polmeasure = cp.fieldData;
      let catcol = CPW.constants.policy_colours[CPW.policy_types.findIndex((e) => e === polmeasure.calc_minorCategory)];

      let poli_ttip = document.createElementNS(svgns, 'title');
      poli_ttip.appendChild(document.createTextNode(
        "" + polmeasure.title + 
        "\nCategory: " + polmeasure.calc_minorCategory + 
        "\nSubcategory: " + polmeasure.calc_subMinorCategory +
        "\nType: " + polmeasure.calc_type
      ));

      let rect = document.createElementNS(svgns, 'rect');
      rect.setAttribute("class", "policy_bar");
      rect.setAttribute("id", cid + "_" + cp.recordId);
      rect.appendChild(poli_ttip);
      rect.setAttribute("fill", catcol);
      rect.setAttribute("x", padding + (estart - x_min) * x_conv);
      rect.setAttribute("width", (estop - estart) * x_conv);
      rect.setAttribute("y", canvas_height + padding + polycount * pbar_width);
      rect.setAttribute("height", pbar_width - padding/2);
      rect.addEventListener("click", CPW.populate_info);
      svg.appendChild(rect);

      // count the number of policies this country has committed
      polycount += 1;
    }
  }

  return(svg);
};

CPW.populate_info = function() {
  let [cid, pid] = this.id.split('_');
  let infobox = document.getElementById('ib_' + cid);
  let policy = CPW.data.policies.filter(p => p.recordId === pid)[0];
  let catcol = CPW.constants.policy_colours[CPW.policy_types.findIndex((e) => e === policy.fieldData.calc_minorCategory)];

  // delete contents
  infobox.innerHTML = 
    "<h3>" + policy.fieldData.title + "</h3>" +
    "<p><strong><span style='color: " + catcol + "'>" + policy.fieldData.calc_minorCategory + "</span> - " + policy.fieldData.calc_subMinorCategory + "</strong><br>" +
    "Type: <strong>" + policy.fieldData.calc_type + "</strong><br>" +
    "Duration: " + policy.fieldData.d_startDate + " - " + policy.fieldData.d_endDate + " [" + policy.fieldData.dateType + "]<br>" +
    "<small>Last updated: " + policy.fieldData.calc_lastUpdate + "</small></p>" +


    "<p><strong>Context:</strong> " + 
    policy.fieldData.descriptionBackgroundInfo.trim("\r").replace(/\r\r/gm, '<br>').replace(/\r(\d+\. |\*)/gm, "<br>- ").replace('\r', ' ') +
    "</p>" +
    "<p><strong>Measure:</strong> " +
    policy.fieldData.descriptionContentOfMeasure.trim("\r").replace(/\r\r/g, '<br>').replace(/\r(\d+\. |\*)/g, "<br>- ").replace('\r', ' ') +
    "</p>" +
    "<p><strong>Effectiveness:</strong> " + policy.fieldData.descriptionUseOfMeasure + "</p>" +
    //"<p>" + policy.fieldData.+ ", " + policy.fieldData.+ "</p>" +
    "<p><a href='" + policy.fieldData.calc_githubURL + "' target='_blank'>More information</a></p><hr>";
  

};

CPW.get_policy_types = function() {
  let data = CPW.data.policies;
  let rec;
  
  // create unique list of policies 
  return(Array.from(new Set(data.map(rec => rec.fieldData.calc_minorCategory))).sort());
};

CPW.get_countries = function() {
  let data = CPW.data.policies;
  let rec;

  // create unique list of countries for which we have data
  return(Array.from(new Set(data.map(rec => rec.fieldData.calc_country))).sort());
};

CPW.onload = function() {

  Promise.all([
    fetch(CPW.constants.urls.policies.backup).then(response => response.json()),
    fetch(CPW.constants.urls.rates.local).then(response => response.json())
  ]).then(([pdata, cdata]) => {

    // save to global object
    CPW.data.policies = pdata.sort(
      function(a,b) { 
        return(new Date(a.fieldData.d_startDate) - new Date(b.fieldData.d_startDate));
      }
    );
    CPW.data.rates = cdata;


    // start processing data
    CPW.initialize();
  }); 
};

CPW.onload();
