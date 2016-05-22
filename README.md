# cloudlogr
A class project of my choosing.  Idea was to create a SCADA-like web page to interact with a remote application behind an eWON VPN router.  Uses eWON's API to interact with the application.

Please note the code in GitHub is many commits ahead of what is running publicly.  

##About This Site
I had a somewhat whimsical idea about creating a web server based data logging client that could be made available on a subscription basis to industrial automation customers.  At the end of my Web Development Immersive training, each student was tasked with creating a project of their own choosing.  Since this idea was buzzing about inside my head, it was the only project I could imagine taking a shot at!

Some of what this server is currently doing is a bit abnormal.  Using my API, a browser can tell the server to begin polling data from an API provide by eWON.  It does so at a given rate and stores the retrieved data in a database after each successful poll.  It will continue to do this even if the user shuts down their browser.

For the polling to stop, the server needs to get a command via the API I wrote.  

##Goals
An API that can be used to control the polling engine in the server.
Use React to enable the browser to be more of an active console for the data logging.
Add chart.js to view data, along with Socket IO to update it as polling occurs on the server.

##API
####POST /apa/v1/startpolling: 
Returns false and takes no action if the database shows that the instance is already polling.  If it finds the schedule and polling was not already enabled, it sets dataPollingState in the DB and starts the polling.
####POST /apa/v1/stoppolling:
Returns false and takes no action if no matching schedule was found in the DB.  Returns true if it finds and updated the schedule to dataPollingState: false in the DB.
####POST /apa/v1/newschedule: 
Instantiates a schedule.  Future use.  
