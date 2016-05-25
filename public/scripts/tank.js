/*
Clear default form value script- by JavaScriptKit.com
*/
function clearText(thefield){
  if (thefield.defaultValue==thefield.value){
    thefield.value = "";
  }
}

var timerID = null
var pollDBData = function(){
  if ($("#data_polling_state").html() === 'Inactive'){ //if DOM shows inactive state
    $.ajax({ // method to tell server to start polling
      url: '/api/v2/startPolling',
      method: 'POST'
    });
    $("#data_polling_state").html("Active");
    console.log('polldata!');
    var pollRate = Number($("#data_poll_rate").html()) * 1000; // get the poll rate in seconds from Dom, convert to ms and store
    console.log("poll rate: " + pollRate);
    timerID = setInterval(getData, pollRate);
    console.log('timerID assigned: ' + timerID);
  } else { // polling is aleady active
   clearInterval(timerID);
  }
}


function getData(){
  console.log('getData started');
  if ($("#data_polling_state").html() === 'Inactive'){ //if DOM shows inactive, stop
    clearInterval(timerID);
  } else {
    $.ajax({ // method to get DB data
      url: '/api/v2/data',
      method: 'GET'
    })
    .success (function(data) { // when it’s done, 'data' will contain the DB data object
      console.log('got data' + data);
      redrawTable(data);
    })
    .fail (function(jqXHR, textStatus, errorThrown) { // if it fails, this data arrives, execute next line
      console.log( 'GET /data uh oh' );
    })
    .always (function() {
    })
  }
}


function redrawTable(data){
  console.log("redrawTable running");
  console.log(data.data[0]);
  data.data.forEach(function(dataEntry, index){
    console.log(dataEntry.value);
    $( "tbody tr:nth-child(" + (1+index) +")" ).html(
      "<td>" + dataEntry.value + "</td>" +
      "<td>" + dataEntry.timestamp + "</td>" +
      "<td>" + (dataEntry.status ? 'good' : dataEntry.statusCode) + "</td>" +
      "<td>" + (dataEntry.eWONMessage || '') + "</td>"
    );
  })
}

// <% schedule.data = schedule.data.reverse(); %><!--want newest first to rendering table-->
// <% schedule.data.slice(0,10).forEach(function(dataEntry){ %>
//   <tbody>
//     <tr>
//       <td ><%= dataEntry.value %></td>
//       <td ><%= dataEntry.timestamp %></td>
//       <td ><%= dataEntry.status ? 'good' : dataEntry.statusCode %></td>
//       <td ><%= dataEntry.eWONMessage %></td>
//     </tr>
//   </tbody>

$(function(){ // after DOM loads,
  if ($("#data_polling_state").html() === 'Active'){ //if DOM shows active, start polling
    var pollRate = Number($("#data_poll_rate").html()) * 1000; // get the poll rate in seconds from Dom, convert to ms and store
    console.log("poll rate: " + pollRate);
    timerID = setInterval(getData, pollRate); // start polling the server
  }
})
