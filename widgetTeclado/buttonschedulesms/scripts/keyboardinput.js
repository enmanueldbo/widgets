function reset(){	
	inputValue = "";
	showInput();
}

function showText(message){
	objBtnMsg.html('<span class="text_single_element">' + message + '</span>');
}

/*
* Keyboard
*/
function addChar(whatbox, character) {
	if ( inputValue.length < maxInput ){
		inputValue += character;	 
	}
	showInput();
}

function deleteChar() {
	inputValue = inputValue.substring(0, inputValue.length - 1); 
	if (inputValue.length == 0) {
		reset();
	}
	showInput();
}

function clearChar() {
		reset();		
}

var statusAddBtn = -1;

function showInput() {
	objBtnInput.html('<span class="text_single_element">' + inputValue + '</span>');
	if (inputValue.length >= minInput && inputValue.length <= maxInput) {
		if ( statusAddBtn != 1 ) {
			showAddBtn();
			statusAddBtn = 1;
		}
	} else {
		if ( statusAddBtn != 0 ) {
			hideAddBtn();
			statusAddBtn = 0;
		}
	}
}

function hideAddBtn() {
	if (foundBtnAdd) {
		objBtnAdd.css('-webkit-filter', 'grayscale(1)');
		objBtnAdd.css('filter', 'gray');
		objBtnAdd.css('filter', 'grayscale(1)');
		if ($.browser.opera && parseFloat($.browser.version) < 10) {
			objBtnAdd.css('opacity', '0.50');
		}
	}
}
	
function showAddBtn() {
	if (foundBtnAdd) {
		objBtnAdd.css('-webkit-filter', '');
		objBtnAdd.css('filter', '');
		objBtnAdd.css('filter', '');
		if ($.browser.opera && parseFloat($.browser.version) < 10) {
			objBtnAdd.css('opacity', '1');
		}
	}
}
	
/*
* Sends an UnitEvent to the Unit Type EventHandler.
*/
function sendUnitEvent (service, serviceExtName, ticket, queueId) {
    var eventName = "REPRINT_TICKET"; /* Should match the Event name specified for the UnitEventHandler in unit.xml */
            
	var params = {"uid" : unitId + ":" + deviceType,
		"branchId":branchId, 
		"queueId":queueId, 
		"queueType":"QUEUE", 
		"service":service, 
		"serviceExtName" : serviceExtName,
		"ticket":ticket
	};
            
    var event =  {"M":"E","E":{"evnt":"","type":"APPLICATION", "prm":""}};
    event.E.evnt = eventName;    
    event.E.prm = params;
        
   /* no need to include qevents_cometd.js, use the parent object */
    parent.qevents.publish('/events/APPLICATION', event);
}       


