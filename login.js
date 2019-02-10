	  var s = window.location.search.substring(7);
	  document.getElementById("Group").innerHTML = "Group ID: " + s;
      // Client ID and API key from the Developer Console
      var CLIENT_ID = '94285525800-hlb6lmdi6s6qv46a3oidrt9o66ujm0j0.apps.googleusercontent.com';
      var API_KEY = 'AIzaSyAaD_twdf0aIdxngcwADINk0GFfiCPOuwM';

      // Array of API discovery doc URLs for APIs used by the quickstart
      var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];

      // Authorization scopes required by the API; multiple scopes can be
      // included, separated by spaces.
      var SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

      var authorizeButton = document.getElementById('authorize_button');
      var signoutButton = document.getElementById('signout_button');
	  var emailbox = document.getElementById('emailbox');

      /**
       *  On load, called to load the auth2 library and API client library.
       */
      function handleClientLoad() {
        gapi.load('client:auth2', initClient);
      }

      /**
       *  Initializes the API client library and sets up sign-in state
       *  listeners.
       */

      function initClient() {
        gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        }).then(function () {
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

          // Handle the initial sign-in state.
          updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          authorizeButton.onclick = handleAuthClick;
          signoutButton.onclick = handleSignoutClick;
        }, function(error) {
          appendPre(JSON.stringify(error, null, 2));
        });
      }

      /**
       *  Called when the signed in status changes, to update the UI
       *  appropriately. After a sign-in, the API is called.
       */
      function updateSigninStatus(isSignedIn) {
        if (isSignedIn) {
			authorizeButton.style.display = 'none';
			signoutButton.style.display = 'block';
			emailbox.style.display = 'none';
			create_event.style.display = 'block';
			listEvents();
        } else {
			authorizeButton.style.display = 'block';
			signoutButton.style.display = 'none';
			emailbox.style.display = 'block';
			create_event.style.display = 'none';
        }
      }

      /**
       *  Sign in the user upon button click.
       */
      function handleAuthClick(event) {
        gapi.auth2.getAuthInstance().signIn();
      }

      /**
       *  Sign out the user upon button click.
       */
      function handleSignoutClick(event) {
        gapi.auth2.getAuthInstance().signOut();
		window.location="index.html";
      }

      /**
       * Append a pre element to the body containing the given message
       * as its text node. Used to display the results of the API call.
       *
       * @param {string} message Text to be placed in pre element.
       */
      function appendPre(message) {
        var pre = document.getElementById('content');
        var textContent = document.createTextNode(message + '\n');
        pre.appendChild(textContent);
      }

      /**
       * Print the summary and start datetime/date of the next ten events in
       * the authorized user's calendar. If no events are found an
       * appropriate message is printed.
       */
      function listEvents() {
		// Get a reference to the database service
		var groupID = window.location.search.substring(7);
		var userEmail=emailbox.value;
		var userEmailID=userEmail.substring(0,userEmail.indexOf("@"));
		var userEmailID=userEmailID.replace(".","");

		var fdref=firebase.database().ref();
		
		fdref.set({'CurrentGroupID':groupID});
		
		//fdref.child('CurrentGroupID').set({'val':groupID});

		fdref.child('Group'+groupID).once('value',function(snapshot){
			if (snapshot.val() === null) {
				fdref.child('Group'+groupID).set({
					numberOfUsers : 0
				});
				for (let i=0;i<744;i++) fdref.child('Group'+groupID).child(i).set({ val:0 });
				appendPre("Add new group successfully");
			}
			else {
				//appendPre("exist");
			}

			fdref.child('Group'+groupID).child(userEmailID).once('value',function(snapshot){
				if (snapshot.val() === null) {
					var temp = fdref.child('Group'+groupID).child('numberOfUsers').transaction(function(currentClicks) {
							return (currentClicks+1);
					});

					fdref.child('Group'+groupID).child(userEmailID).set({
						email : userEmail
					});
					appendPre("Registered successfully");

					var dMin = new Date();
					dMin.setDate(1);
					dMin.setHours(0);
					dMin.setMinutes(0);
					var dMax = new Date();
					dMax.setMonth(dMax.getMonth()+1);
					dMax.setDate(1);
					dMax.setHours(0);
					dMax.setMinutes(0);

					gapi.client.calendar.events.list({
					  'calendarId': 'primary',
					  'timeMin': (dMin).toISOString(),
					  'timeMax': (dMax).toISOString(),
					  'showDeleted': false,
					  'singleEvents': true,
					  'orderBy': 'startTime'
					}).then(function(response) {
					  var events = response.result.items;

					  if (events.length > 0) {
						for (i = 0; i < events.length; i++) {
						  var event = events[i];
						  var whenS = event.start.dateTime;
						  var whenE = event.end.dateTime;

						  var dS,dE,hS,hE;

						  if (!whenS) {
							whenS=event.start.date;
							whenE=event.end.date;
							dS = new Date(whenS);
							dE = new Date(whenE);
							hS = dS.getDate()*24;
							hE = dE.getDate()*24-1;
						  }
						  else {
							var dS = new Date(whenS);
							var dE = new Date(whenE);

							hS = (dS.getDate()-1)*24 + dS.getHours();
							hE = (dE.getDate()-1)*24 + dE.getHours();
							if (dE.getMinutes()==0) hE--;
						  }

						  for (j=parseInt(hS);j<=parseInt(hE);j++) {
							var temp = fdref.child('Group'+groupID).child(j).child('val').transaction(function(currentClicks) {
								return (currentClicks || 0) + 1;
							});
						  }
						}
					  } else {
						//appendPre('No events found.');
					  }
					});
				}
				else {
					//appendPre("Already registered");
				}
			});

		});


      }
