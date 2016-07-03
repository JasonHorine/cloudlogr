/*
Clear default form value script- by JavaScriptKit.com
*/
function clearText(thefield){
  if (thefield.defaultValue==thefield.value){
    thefield.value = "";
  }
}


var timerID = null
var pollDBData = function(){ // Start Polling button pressed
  if ($("#data_polling_state").html() === 'Inactive'){ //if DOM shows inactive state
    $.ajax({ // API route to tell server to start polling
      url: '/api/v2/startPolling',
      method: 'POST'
    })
    .done(function(data){ // if the server repsonds without error
      console.log("pollDBData.done got: " + data);
      if (data === "no schedule"){
        // do nothing, would be better to show error message to user
      } else {  //polling has started
        $("#data_polling_state").html("Active").removeClass("stop").addClass("go");
        $(".poll_rate_change").hide();
        $("#start_polling_button").hide();
        $("#stop_polling_button").show();
        $("#get_one_reading_button").hide();
        //console.log('polldata!');
        var pollRate = Number($("#data_poll_rate").html()) * 1000; // get the poll rate in seconds from Dom, convert to ms and store
        //console.log("poll rate: " + pollRate);
        timerID = setInterval(getData, pollRate);
        //console.log('timerID assigned: ' + timerID);
        redrawTable(data); // if object returned is data, pass it to redrawTable function
      }
    })
    .always(function(data){
      console.log("pollDBData got: " + data);
    })
  } //else { // polling is aleady active
  //  clearInterval(timerID);
  // }
}

var getOneReading = function(){
  $.ajax({ // method to tell server to start polling
    url: '/api/v2/oneReading',
    method: 'GET'
  })
  .done(function(data){ // data is the server's response
    console.log("getOneReading.done got: " + data);
    if (data === "no schedule"){
        // do nothing, would be better to show error message to user
    } else {  //polling has started
      redrawTable(data); // if object returned is data, pass it to redrawTable function
    }
  })
}

var stopPolling = function(){
  if ($("#data_polling_state").html() === 'Active'){ //if DOM shows active state
    $.ajax({ // API route to tell server to stop polling
      url: '/api/v2/stopPolling',
      method: 'POST'
    })
    .done(function(data){ // if the server repsonds without error
      console.log("pollDBData.done got: " + data);
      if (data === false){
        // do nothing, would be better to show error message to user
      } else {  //polling has stopped
        $("#data_polling_state").html("Inactive").removeClass("go").addClass("stop");
        $(".poll_rate_change").show();
        $("#start_polling_button").show();
        $("#stop_polling_button").hide();
        $("#get_one_reading_button").show();
      }
    })
    .always(function(data){
      console.log("pollDBData got: " + data);
      clearInterval(timerID); // stop the browser polling
    })
  } //else { // polling is aleady active
  //  clearInterval(timerID);
  // }
}

function getData(){
  //console.log('getData started');
  if ($("#data_polling_state").html() === 'Inactive'){ //if DOM shows inactive, stop
    clearInterval(timerID);
  } else {
    $.ajax({ // method to get DB data
      url: '/api/v2/data',
      method: 'GET'
    })
    .success (function(data) { // when it’s done, 'data' will contain the DB data object
      //console.log('got data' + data);
      // if data returns with polling status req false and there is a setInterval running, need to stop setInterval process
      if (timerID && !data.dataPollingStateReq){
        clearInterval(timerID);   // stop the browser polling
        //console.log("getData stopped due to timerID && !data.dataPollingStateReq " + timerID + " " + data.dataPollingStateReq);
      }
      redrawTable(data);
    })
    .fail (function(jqXHR, textStatus, errorThrown) { // if it fails, this data arrives, execute next line
      //console.log( 'GET /data uh oh' );
    })
    .always (function() {
    })
  }
}


function redrawTable(data){
  //console.log("redrawTable running");
  //console.log(data.data[0]);
  data.data.forEach(function(dataEntry, index){
    //console.log(dataEntry.value);
    $( "tbody tr:nth-child(" + (1+index) +")" ).html(
      "<td>" + dataEntry.value.toFixed(1) + "</td>" +
      "<td>" + dataEntry.timestamp + "</td>" +
      "<td>" + (dataEntry.status ? 'good' : dataEntry.statusCode) + "</td>" +
      "<td>" + (dataEntry.eWONMessage || '') + "</td>"
    );
  })
  copyTableDataToChart(); // copy the data to the chart
  window.myLine.update(); // redraw the chart
}

function copyTableDataToChart(){
  //console.log(jQuery('tbody tr td:first-child'));
  //console.log('before ' + config.data.dataasets);
  jQuery('tbody tr td:first-child').each(function(i, element){
    //console.log(Number(element.innerHTML));
    config.data.datasets[0].data[i] = Number(element.innerHTML);
  });
  //console.log('after ' + config.data.dataasets);

// var rows = $("tbody tr",$("#tblVersions")).map(function() {
//     return [$("td:eq(0) input:checkbox:checked",this).map(function() {
//       return this.innerHTML;
//     }).get()];
//   }).get();

//jQuery('tbody tr').each(console.log(jQuery('td:first-child')));

//console.log($('table tr > td:nth-child(1)').html())
};//.forEach(function(stringValue, i){ // get each first TD tag
//  config.data.datasets[0].data[i]= Number(stringValue); // place it into the chart line
//});

//     $.each(config.data.datasets, function(i, dataset) {
//         dataset.data = dataset.data.map(function() {
//             return randomScalingFactor();
//         });

//     });

//     window.myLine.update();
//)};

$(function(){ // after DOM loads,
  if ($("#data_polling_state").html() === 'Active'){ //if DOM shows active, start polling
    var pollRate = Number($("#data_poll_rate").html()) * 1000; // get the poll rate in seconds from DOM, convert to ms and store
    // console.log("poll rate: " + pollRate);
    timerID = setInterval(getData, pollRate); // start polling the server
    $("#data_polling_state").removeClass("stop").addClass("go");
    $(".poll_rate_change").hide();
    $("#start_polling_button").hide();
    $("#stop_polling_button").show();
    $("#get_one_reading_button").hide();
  } else {
    $("#data_polling_state").removeClass("go").addClass("stop");
    $(".poll_rate_change").show();
    $("#start_polling_button").show();
    $("#stop_polling_button").hide();
    $("#get_one_reading_button").show();
  }
})

// chart.js
var XAXIS = ["0", "t-1", "t-2", "t-3", "t-4", "t-5", "t-6", "t-7", "t-8", "t-9"];

var randomScalingFactor = function() {
    return Math.round(Math.random() * 100);
    //return 0;
};
var randomColorFactor = function() {
    return Math.round(Math.random() * 255);
};
var randomColor = function(opacity) {
    return 'rgba(' + randomColorFactor() + ',' + randomColorFactor() + ',' + randomColorFactor() + ',' + (opacity || '.3') + ')';
};

Chart.defaults.global.defaultFontColor = '#000';
Chart.defaults.global.defaultFontFamily = "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif";
Chart.defaults.global.defaultFontSize = 18;
Chart.defaults.global.defaultFontStyle = 'normal';

var config = {
    type: 'line',
    data: {
        labels: ["0", "t-1", "t-2", "t-3", "t-4", "t-5", "t-6", "t-7", "t-8", "t-9"],
        datasets: [{
            label: jQuery('caption h3').html(), // pick it out of the DOM
            data: Array(), // new empty array
            fill: true,
            borderDash: [5, 1],
            borderColor: 'rgba(255,255,0,1.0)', // line
            backgroundColor: 'rgba(10,10,255,0.5)', // line fill
            pointBorderColor: 'rgba(255,255,255,1.0)', // dot border
            pointBackgroundColor: 'rgba(255,255,255,0.5)', // dot fill
            pointBorderWidth: 1
        }]
    },
    options: {
        responsive: true,
        title:{
            display: false
        },
        tooltips: {
            mode: 'label',
        },
        hover: {
            mode: 'label'
        },
        scales: {
            xAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Value'
                },
                ticks: { // fix the scale at 0-100
                  max: 100,
                  min: 0
                }
            }]
        }
    }
};
//console.log("var config done: " + config.data.datasets[0].data);

// $.each(config.data.datasets, function(i, dataset) {
//     dataset.borderColor = randomColor(0.4);
//     dataset.backgroundColor = randomColor(0.5);
//     dataset.pointBorderColor = randomColor(0.7);
//     dataset.pointBackgroundColor = randomColor(0.5);
//     dataset.pointBorderWidth = 1;
// });

window.onload = function() {
    copyTableDataToChart();
    // console.log("getTableDataToChart Ran");
    var ctx = document.getElementById("canvas").getContext("2d");
    window.myLine = new Chart(ctx, config);
};

// $('#randomizeData').click(function() {
//     $.each(config.data.datasets, function(i, dataset) {
//         dataset.data = dataset.data.map(function() {
//             return randomScalingFactor();
//         });
//     });

//     window.myLine.update();
// });

// $('#addDataset').click(function() {
//     var newDataset = {
//         label: 'Dataset ' + config.data.datasets.length,
//         borderColor: randomColor(0.4),
//         backgroundColor: randomColor(0.5),
//         pointBorderColor: randomColor(0.7),
//         pointBackgroundColor: randomColor(0.5),
//         pointBorderWidth: 1,
//         data: [],
//     };

//     for (var index = 0; index < config.data.labels.length; ++index) {
//         newDataset.data.push(randomScalingFactor());
//     }

//     config.data.datasets.push(newDataset);
//     window.myLine.update();
// });

// $('#addData').click(function() {
//     if (config.data.datasets.length > 0) {
//         var month = XAXIS[config.data.labels.length % XAXIS.length];
//         config.data.labels.push(month);

//         $.each(config.data.datasets, function(i, dataset) {
//             dataset.data.push(randomScalingFactor());
//         });

//         window.myLine.update();
//     }
// });

// $('#removeDataset').click(function() {
//     config.data.datasets.splice(0, 1);
//     window.myLine.update();
// });

// $('#removeData').click(function() {
//     config.data.labels.splice(-1, 1); // remove the label first

//     config.data.datasets.forEach(function(dataset, datasetIndex) {
//         dataset.data.pop();
//     });

//     window.myLine.update();
// });
// chart.js
