$(function(){

  //$('body').append('');

  var tableViz = $("#tableViz");

  var height = 900;
  var width = 1200;

  var left = 350;

  var svg = tableViz.append('<svg height="' + height + '" width="' + width + '" class="chart"></svg>');


  d3.json("https://site.web.api.espn.com/apis/v2/sports/soccer/eng.1/standings").then(function(data){

    if (!data || !data.children || !data.children[0] || !data.children[0].standings || !data.children[0].standings.entries) {
      return;
    }

    d3.json("https://site.web.api.espn.com/apis/site/v2/sports/soccer/ENG.1/teams/359/schedule?&fixture=true").then(function(scheduleData) {

      console.log(scheduleData);

      var fixtures = scheduleData.events;

      if (!fixtures) {
        return;
      }

      var now = new Date();
      fixtures = fixtures.filter(function(d, i) {
        var date = new Date(d.date);
        if (now > date) {
          console.log('old');
          return false;
        }
        return true;
      });

      var table = data.children[0].standings.entries;

      console.log(table);
      console.log(fixtures);

      var tableMapped = $.map(table, function(item, index) {
        var team = item.team.shortDisplayName;
        var logo = item.team.logos[0].href;
        var abbrev = item.team.abbreviation;

        var points = item.stats[2].value;
        var gamesPlayed = item.stats[0].value;

        let pointsPerGame = points / gamesPlayed;

        //let pointsPerGame = item.stats[9].value;

        var goalDiff = item.stats[8].value;

        return {
          name:team,
          logo:logo,
          points:points,
          gamesPlayed:gamesPlayed,
          pointsPerGame:pointsPerGame,
          abbrev:abbrev,
          place:index + 1,
          goalDiff:goalDiff
        }
      });

      tableMapped = tableMapped.reverse();

      var team = $.grep(tableMapped, function(item, index) {
        return item.abbrev == "ARS";
      });
      //console.log(team);

      var team = team[0];
      var points = team.points;

      let maxGames = d3.max(tableMapped, d => d.gamesPlayed);

      $.each(tableMapped, function(index, item) {

        item.gamesInHand = maxGames - item.gamesPlayed;
        //console.log(item);
        if (item.points > points) {
          if (item.points <= points + 3) {
            item.catchable = true;
          } else if (item.points <= points + 6) {
            item.farcatchable = true;
          }
        }
        if (item.points <= points) {
          if (item.points >= points - 3) {
            item.cancatch = true;
          } else if (item.points >= points - 6) {
            item.farcatch = true;
          }
        }
      });

      console.log(tableMapped);


      var minPts = d3.min(tableMapped, function(d, i) { return d.points; });
      var maxPts = d3.max(tableMapped, function(d, i) { return d.points; });

      console.log('games played', team.gamesPlayed);
      let gamesRemaining = 38 - team.gamesPlayed;
      console.log('games remaining', gamesRemaining);
      let maxPointsRemaining = gamesRemaining * 3;
      let absMaxPoints = maxPts + maxPointsRemaining;
      maxPts = absMaxPoints;

      //console.log(minPts, maxPts);
      var y = d3.scaleLinear()
        .domain([minPts, maxPts])
        .range([height -20, 20]);


      var chart = d3.select(".chart")
        .attr("width", width)
        .attr("height", height);

      var dots = chart.selectAll("g.teams")
        .data(tableMapped)
        .enter().append("g").attr("class", "teams");

      dots.append("circle")
          .attr("class", function(d) {
            var c = "team";
            if (d.catchable) {
              c += " catchable";
            }
            if (d.cancatch) {
              c+= " cancatch";
            }
            if (d.farcatchable) {
              c += " farcatchable";
            }
            if (d.farcatch) {
              c += " farcatch";
            }
            return c;
          })

          .attr("r", 10)
          .attr("cx", left + 30)
          .attr("cy", function(d) { return y(d.points); });

      dots.append("text")
          .attr("x", left)
          .attr("y", function(d) { return y(d.points); })
          .attr("dy", ".35em")
          .attr("class", function(d) {
            var c = d.abbrev;
            if (d.catchable) {
              c += " catchable";
            }
            if (d.cancatch) {
              c+= " cancatch";
            }
            if (d.farcatchable) {
              c += " farcatchable";
            }
            if (d.farcatch) {
              c += " farcatch";
            }
            return c;r
          })
          .text(function(d) {
            return `${ d.name } (${ getNumberWithOrdinal(d.place) }, ${ d.points }, ${ d.pointsPerGame.toFixed(2) }, ${ d.goalDiff }, ${ d.gamesInHand })`;

            //+ " (" + getNumberWithOrdinal(d.place) + ", " + d.points + ", " + d.goalDiff + ")";
          });

        dots.append("image")
            .attr("href", function(d) { return d.logo; })
            .attr("x", left + 10)
            .attr("y", function(d) { return y(d.points) - 20; });

      var gamesOut = 38 - team.gamesPlayed;

      var projected = chart.selectAll("g.projected")
        .data(fixtures) // Arsenal
        .enter().append("g").attr("class", "projected");

      var points = team.points;
      //console.log(points);

      function r(d, i) {
        return (i == 0) ? 10 : 5;
      }
      function cl(d, i) {
        return (i == 0) ? "projectedTeam team" : "projectedTeam";
      }

      var leftBase = left + 110;

      projected.append("circle")
        .attr("class", cl)
        .attr("r", r)
        .attr("cx", function(d, i) { return leftBase + (i * 50); })
        .attr("cy", function(d, i) { return y(points + (3 * (i + 1))); });

      projected.append("circle")
        .attr("class", cl)
        .attr("r", r)
        .attr("cx", function(d, i) { return leftBase + (i * 50); })
        .attr("cy", function(d, i) { return y(points + (2 * (i + 1))); });

      projected.append("circle")
        .attr("class", cl)
        .attr("r", r)
        .attr("cx", function(d, i) { return leftBase + (i * 50); })
        .attr("cy", function(d, i) { return y(points + (1 * (i + 1))); });

      projected.append("text")
        .attr("class", "projectedTeamLabel")
        .attr("dy", ".35em")
        .attr("x", function(d, i) { return leftBase + (i * 50); })
        .attr("y", function(d, i) { return y(points + (3 * (i + 1))) - 15; })
        .text(function(d) {
          var date = new Date(d.date);

          return d.shortName + ' ' + (date.getMonth() + 1) + '/' + date.getDate();
        });

    // Yaxis Labels
    // Place and label location


      // Store the projected coordinates of the places for the foci and the labels
      /*places.features.forEach(function(d, i) {
          var c = projection(d.geometry.coordinates)
          foci.push({x: c[0], y: c[1]});
          labels.push({x: c[0], y: c[1], label: d.properties.name})
      });*/

      var keyedTable = {};
      tableMapped.forEach(function(d, i) {
        /*var c = { x : 180, y : y(d.points), label : d.name };
        foci.push(c);
        labels.push(c);*/

        if (!keyedTable[d.points]) {
          keyedTable[d.points] = [];
        }
        keyedTable[d.points].push(d);
      });

      for (var i in keyedTable) {
        var teams = keyedTable[i];
        if (teams.length > 1) {

          var labels = [];
          var links = [];

          var l = left - 240;

          teams.forEach(function(d, i) {
            var c = { x : l, y : y(d.points), label : d.name, place: d.place };
            labels.push(c);
            var t = (i < teams.length - 1) ? teams[i + 1].name : teams[0].name;
            links.push({source:d.name, target:t});
          });



          console.log(labels);
          console.log(links);
          var labelGroup = chart.append("g");
          buildForceLayout(labelGroup, labels, l, links);
        }
      }

      // Create the force layout with a slightly weak charge
      /*var force = d3.layout.force()
          .nodes(labels)
          .charge(-20)
          .gravity(0)
          .size([width, height]);*/

      /*var force = d3.forceSimulation(labels)
        .force("charge", d3.forceManyBody(5))
        .force("collision", d3.forceCollide())
        .force("x", d3.forceX(180));
        //.force("center", d3.forceCenter(width / 2, height / 2));

      // Append the place labels, setting their initial positions to
      // the feature's centroid
      var placeLabels = chart.selectAll('.place-label')
          .data(labels)
          .enter()
          .append('text')
          .attr('class', 'place-label')
          .attr('x', function(d) { return d.x; })
          .attr('y', function(d) { return d.y; })
          .attr('text-anchor', 'right')
          .text(function(d) { return d.label; });

      force.on("tick", function(e) {
          //var k = .1 * e.alpha;
          var k = 1;
          labels.forEach(function(o, j) {
              // The change in the position is proportional to the distance
              // between the label and the corresponding place (foci)
              o.y += (foci[j].y - o.y) * k;
              o.x += (foci[j].x - o.x) * k;
          });

          // Update the position of the text element
          chart.selectAll("text.place-label")
              .attr("x", function(d) { return d.x; })
              .attr("y", function(d) { return d.y; });
      });*/

      //force.start();



    });

  });


});

function buildForceLayout(svg, labels, left, links) {


  console.log(labels);

  var force = d3.forceSimulation(labels)
    //.force("charge", d3.forceManyBody().strength(-5))
    .force("collision", d3.forceCollide(20))
    .force("links", d3.forceLink(links).id(function(d) { return d.label; }).distance(20))
    .force("x", d3.forceX(left-20));
    //.force("center", d3.forceCenter(width / 2, height / 2));

  // Append the place labels, setting their initial positions to
  // the feature's centroid
  var placeLabels = svg.selectAll('.smart-label')
      .data(labels)
      .enter()
      .append('text')
      .attr('class', 'smart-label')
      .attr('x', function(d) { return d.x; })
      .attr('y', function(d) { return d.y; })
      .attr('dx', '.15em')
      .text(function(d) { return d.label + "(" + getNumberWithOrdinal(d.place) + ")"; });

  var link = svg.append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

  force.on("tick", function(e) {
      //var k = .1 * e.alpha;
      var k = 1;
      labels.forEach(function(o, j) {
          // The change in the position is proportional to the distance
          // between the label and the corresponding place (foci)
          o.y += (labels[j].y - o.y) * k;
          o.x += (labels[j].x - o.x) * k;
      });


      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      // Update the position of the text element
      svg.selectAll("text.smart-label")
          .attr("x", function(d) { return d.x; })
          .attr("y", function(d) { return d.y; });
  });

}

function _map (num, in_min, in_max, out_min, out_max) {
  return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function getNumberWithOrdinal(n) {
    var s=["th","st","nd","rd"],
    v=n%100;
    return n+(s[(v-20)%10]||s[v]||s[0]);
 }
