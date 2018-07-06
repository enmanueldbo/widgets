var develop = false;
var scheduleVersion = -1;
var services ;
var servicesToRetrieve = new Array();
var servicesSchedules = new Array();
var buttonsOnSurface =  new Array();
var buttonsStatus = new Array();
var scheduleGroups = [];
var excludeGroups = [];
var useServiceQueueRest = false;
var delaying = false;

//-- standard time how often the retrieved values should be compared
var checkScheduleTime = 10 * 1000; // 30 seconds
		
//-- how often new values should be fetched from the setting screen --//
var getStoredSettingsTime = 10 * 60 * 1000 ; // every 10 minutes
	
if (develop) {
	getStoredSettingsTime = 30*1000;
}

function getServices(){
		services=wwRest.getServices(branchId);
		getButtonsOnSurface();
	//	getServiceQueues();
}

function getServiceQueues(){
	//not implemented yet
	//Path("/branches/{branchId}/services/{serviceId}/queue")
}

function getButtonsOnSurface(){
	
// add new attributed to be able to find the correct button for the service later on
// and place all valuable data from the button into an object	
	var parent = $(window.parent.document);	
	for (i=0 ; i < services.length ; i++) {
		var foundOnSurface=false;
		var objBtn = $(parent).find('div[value="' + services[i].id +'"][name="button"]');
		if (objBtn != undefined) {	
			objBtn.attr('service',services[i].id);
			if  (objBtn.length > 0) {
				foundOnSurface = true;
				objBtn.attr('service',services[i].id);
				for (j = 0 ; j < objBtn.length ; j++) {
					var testObj = $(parent).find('div[id="' + objBtn[j].id +'"][name="button"]');
					var activeImage ="";
					if ($.browser.opera && parseFloat($.browser.version) < 10) {
						// needed for TP since the button component is formed different on a tp
						activeImage=testObj.find('div[class="tp_img_hack"]').css('background-image');
						activeImage=activeImage.substring(4, activeImage.length-1);
					} else {
						activeImage = testObj.find('img').attr("src");
					}
					var currentButton = {id:objBtn[j].id , service : services[i].id, href:objBtn[j].getAttribute('href'), value:objBtn[j].getAttribute('value'), image : activeImage, status : "-" };
					buttonsOnSurface.push(currentButton);
				}
			}
		}
		if (foundOnSurface) {
			servicesToRetrieve.push(services[i].id);
		}
	}
	// add for the new extended button	
	for (i=0 ; i < services.length ; i++) {
		var foundOnSurface=false;
		var objBtn = $(parent).find('div[value="' + services[i].id +'"][name="button_extended"]');
		if (objBtn != undefined) {	
			objBtn.attr('service',services[i].id);
			if  (objBtn.length > 0) {
				foundOnSurface = true;
				objBtn.attr('service',services[i].id);
				for (j = 0 ; j < objBtn.length ; j++) {
					var testObj = $(parent).find('div[id="' + objBtn[j].id +'"][name="button_extended"]');
					var activeImage ="";
					if ($.browser.opera && parseFloat($.browser.version) < 10) {
						// needed for TP since the button component is formed different on a tp
						activeImage=testObj.find('div[class="tp_img_hack"]').css('background-image');
						activeImage=activeImage.substring(4, activeImage.length-1);
					} else {
						activeImage = testObj.find('img').attr("src");
					}
					var currentButton = {id:objBtn[j].id , service : services[i].id, href:objBtn[j].getAttribute('href'), value:objBtn[j].getAttribute('value'), image : activeImage };
					buttonsOnSurface.push(currentButton);
				}
			}
		}
		if (foundOnSurface) {
			servicesToRetrieve.push(services[i].id);
		}
	}
	getStoredSettings();
}
	
function buttonDisable(serviceId, smsSetting, page) {
	var checkSms = false;
	if (smsSetting != undefined) {
		var smsValue = smsSetting.split("|");
		if ( parseInt(smsValue[0],10) == 1) {
			checkSms = true;
		}
	}

	for (var i = 0 ; i < buttonsOnSurface.length ; i++) {
		if (buttonsOnSurface[i].value == serviceId && buttonsOnSurface[i].status != "inactive") {
			buttonsOnSurface[i].status = "inactive";
			var parent = $(window.parent.document);
			var objBtn = $(parent).find('div[id="' + buttonsOnSurface[i].id +'"]');
			if (buttonHide){
				// remove button
				objBtn.css('display', 'none');
			} else {
				objBtn.attr('value','-1');
				objBtn.attr('href','#'+ page);
				if ( inactiveImage != '') {
					if ($.browser.opera && parseFloat($.browser.version) < 10) {
					// needed for TP since the button component is formed different on a tp
						objBtn.find('div[class="tp_img_hack"]').css('background-image', 'url(' + inactiveImage + ')');	
					} else {
						objBtn.find('img').attr("src", inactiveImage);
					}
				}
			}
			
			if (window.parent.document.getElementById(buttonsOnSurface[i].id)){
				window.parent.document.getElementById(buttonsOnSurface[i].id).removeEventListener ('click', buttoncheckSms, false);
			}
		}
	}
}

function buttonEnable(serviceId, smsSetting) {
	var checkSms = false;
	if (smsSetting != undefined) {
		var smsValue = smsSetting.split("|");
		if ( parseInt(smsValue[0],10) == 1) {
			checkSms = true;
		}
	}

	for (i = 0 ; i < buttonsOnSurface.length ; i++) {
		if (buttonsOnSurface[i].value == serviceId && buttonsOnSurface[i].status != "active") {
			buttonsOnSurface[i].status = "active";
			var parent = $(window.parent.document);
			var objBtn = $(parent).find('div[id="' + buttonsOnSurface[i].id +'"]');
			if (buttonHide){
				// show button since it could be hidden
				objBtn.css('display', 'block');
			} else {
				objBtn.attr('value',buttonsOnSurface[i].value);
				objBtn.attr('href',buttonsOnSurface[i].href);
				if ( inactiveImage != '') {
					if ($.browser.opera && parseFloat($.browser.version) < 10) {
					// needed for TP since the button component is formed different on a tp
						objBtn.find('div[class="tp_img_hack"]').css('background-image', 'url(' + buttonsOnSurface[i].image + ')');	
					} else {
						objBtn.find('img').attr("src", buttonsOnSurface[i].image);
					}
				}
			}
			
			objBtn.attr('value','-1');
			objBtn.attr('href','#');
			if (window.parent.document.getElementById(buttonsOnSurface[i].id)){
				window.parent.document.getElementById(buttonsOnSurface[i].id).addEventListener ('click', buttoncheckSms, false);
			}
		}
	}
}

function buttoncheckSms() {
	printServiceId = -1 ;
    printHref = "";
	printQueueId = -1;
	printDivId = this.id;
	var showSmsPage = false;
	var maxTicketReachedPage = "";
	
	
	for (i = 0 ; i < buttonsOnSurface.length ; i++) {
		if (buttonsOnSurface[i].id == printDivId) {
			printServiceId = parseInt(buttonsOnSurface[i].value,10);
			printHref = buttonsOnSurface[i].href;
		}
	}
	
	for (var j=0 ; j < servicesSchedules.length ; j++) {
		if ( parseInt(servicesSchedules[j].id,10) == printServiceId ) {
			var q = (servicesSchedules[j].schedule).split('@');
			var ticketsSetting = q[8].split("|");
			if (ticketsSetting != undefined) {
				maxTicketReachedPage = checkTicketsTaken( ticketsSetting[0], ticketsSetting[1] );
			}
		}		
	}
	
	if ( maxTicketReachedPage != "" ) {
		wwClient.switchHostPage(maxTicketReachedPage);
	} else {
		
		for (var j=0 ; j < servicesSchedules.length ; j++) {
			if ( parseInt(servicesSchedules[j].id,10) == printServiceId ) {
				var q = (servicesSchedules[j].schedule).split('@');
				var smsSetting = q[9];
				if (smsSetting != undefined) {
					var smsValue = smsSetting.split("|");
					showSmsPage = checkQueue(smsValue[0],smsValue[1],smsValue[2]);
				}
			}		
		}
		
		if ( showSmsPage == true ) {
			wwClient.switchHostPage(inputPage);
		} else {
			printTicket(false);
		}
	}
}	

function checkTicketsTaken(level,page) {
	var x = "";
	
	if ( parseInt( level, 10 ) > -1 ) {
		var ticketsTaken = wwRest.getBranchVariable( branchId, "serviceTickets" + printServiceId );
		if ( ticketsTaken != undefined ){
			ttt = ( ticketsTaken.value ).split( "," );
			var lastDate = parseInt( ttt[0], 10 );
			var taken = parseInt( ttt[1], 10 );
			if ( taken + "" == "NaN" ) {
				taken = 0;
			}
			
			var d = new Date();
			//-- current month of year --//
			var month = d.getUTCMonth() + 1;
			//-- current day of month --//
			var day = d.getUTCDate();
			var year = d.getFullYear();
			var currentDate = ( year * 10000 ) + ( day * 100 ) + month;
			if (  lastDate == currentDate && taken  >= parseInt( level, 10 ) ) {
				x = maxTicketPage;
				if ( page != "" ) {
					x = page;
				}
			}
		}
	}
	return x;
}


function checkQueue(active,type, level) {
	var x = false;
	if (parseInt(active,10) == 1) {
		if (parseInt(level,10) == -1) {
			x = true; 	
		} else {
			var queueRelation = getQueueRelation();
			queueRelation = queueRelation.split("@");
			for ( var k = 0; k < queueRelation.length; k++ ) {
				var relation = queueRelation[k].split(",");
				if ( parseInt(relation[0],10) == printServiceId ) {
					var queue = wwRest.getQueue(branchId,parseInt(relation[1],10));
					if ( parseInt(type,10) == 1 && parseInt(level,10) <= parseInt(queue.customersWaiting,10) ) {  
						x = true;
					} 
					if ( parseInt(type,10) == 2 && parseInt(level,10) <= parseInt(queue.waitingTime,10) ) {  
						x = true;
					} 
				}

			}
		}
	}
	return x;
}

function getQueueRelation () {
	var t = wwRest.getBranchVariable(branchId, "queue_relation");
	if (t != undefined) {
		t = t.value;
	} else {
		t="";
		wwClient.log("INFO", "Cannot retrieve Queue-Service relation, make sure to have the Notification Unit in your Equpment Profile!");
	}
	return t;
}

function printTicket(addParam) {
	if (!delaying) {
		printTicketExecute(addParam);
		delaying = true;
		setTimeout(
			function() {
				delaying = false;
		}, buttonTimeDelay * 1000 );
	}
} 

function printTicketExecute(addParam) {
	var params = {};
	params.services = [printServiceId];
	params.parameters = {};
	if (addParam == true) {
		params.parameters[field] = countryCode + inputValue;
	}
		if	(cacheLang != "") {
		params.parameters.lang = cacheLang;
	}
	
	if	(cacheLevel != "") {
		params.parameters.level = cacheLevel;
	}
	
	if	(cacheCustom1 != "") {
		params.parameters.custom1 = cacheCustom1;
	}
	
	if	(cacheCustom2 != "") {
		params.parameters.custom2 = cacheCustom2;
	}
	
	if	(cacheCustom3 != "") {
		params.parameters.custom3 = cacheCustom3;
	}
	
	if	(cacheCustom4 != "") {
		params.parameters.custom4 = cacheCustom4;
	}
	
	if	(cacheCustom5 != "") {
		params.parameters.custom5 = cacheCustom5;
	}
	
	var response = wwRest.createVisitByUnitId( unitId, params);
	if (printHref != null) {
		printHref = printHref.substring(1);  // remove the leading #
			wwClient.switchHostPage(printHref);
	} else {
		wwClient.switchHostPage(startPage);
	}
	reset();
	cacheLang="";
	cacheLevel="";
	cacheCustom1="";
	cacheCustom2="";
	cacheCustom3="";
	cacheCustom4="";
	cacheCustom5="";
}

//branch var for schedule days 		----	"serviceSchedule+serviceId
//---|closed1|-1@0|700|2200@1|700|1800|1900|2200@1|700|2200@1|700|2200@1|700|2200@1|700|2200@0|700|2200@-1@1|1|-1

//branch var for exclude days 		----	"serviceScheduleExclude"+serviceId
//2512,2612
function getStoredSettings(){
	var t = wwRest.getBranchVariable(branchId, "serviceScheduleVersion" );
	var s = 199998;
	if (t != undefined ) {
		s = parseInt(t.value,10);
		setTimeout(getStoredSettings,getStoredSettingsTime);
		if (s != scheduleVersion) {
			getScheduleTemplates();
			scheduleVersion = s;
		}
	} else {
		wwClient.log("INFO", "No schedule settings found, try to sync from Central!");
		checkVarOnCentral();
	}
}

function checkVarOnCentral() {
	var t = wwRest.getGlobalVariable( branchId + agentIdSplit +  "serviceScheduleVersion" );
	if (t != undefined ) {
		wwRest.setBranchVariable( branchId, "serviceScheduleVersion", t.value );
		syncTemplatesFromCentral();
	} else {
	// saving the var
		wwClient.log("INFO", "No schedule settings on Central found, please use the Schedule Admin to setup the schedules!");
		wwRest.setBranchVariable(branchId, "serviceScheduleVersion", 199999 );
		getStoredSettings();
	}
}

function syncTemplatesFromCentral() {
	var t = wwRest.getGlobalVariable( branchId + agentIdSplit + "scheduleServGroups" );
	if (t != undefined) {
		wwRest.setBranchVariable(branchId, "scheduleServGroups", t.value );
		var numOfGroups = parseInt(t.value, 10);	
		for ( var a = 0; a <= numOfGroups; a++ ) {
			v = wwRest.getGlobalVariable( branchId + agentIdSplit + "scheduleServGrp" + a );
			if ( v != undefined ){
				wwRest.setBranchVariable(branchId, "scheduleServGrp" + a, v.value );
			}
			v = wwRest.getGlobalVariable( branchId + agentIdSplit + "scheduleServExclGrp" + a );
			if ( v != undefined ){
				wwRest.setBranchVariable(branchId, "scheduleServExclGrp" + a, v.value );
			}
		}
	}
	wwClient.log("INFO", "Schedule Templates retrieved from Central");
	syncServicesFromCentral();
}

function syncServicesFromCentral() {
	for ( var a = 0; a < services.length; a++ ) {
		sn = services[a].id;
		v = wwRest.getGlobalVariable( branchId + agentIdSplit + "serviceSchedule" + sn );
		if ( v != undefined ){
			wwRest.setBranchVariable(branchId, "serviceSchedule" + sn, v.value );
		}
		v = wwRest.getGlobalVariable( branchId + agentIdSplit + "serviceScheduleExclude" + sn );
		if ( v != undefined ){
			wwRest.setBranchVariable(branchId, "serviceScheduleExclude" + sn, v.value );
		}
		wwRest.setBranchVariable(branchId, "serviceTickets" + sn, "19700101,0" );
	}	
	wwClient.log("INFO", "Schedule settings retrieved from Central");
	getStoredSettings();
}

function getScheduleTemplates(){
	var s ;
	var numOfGroups = 0;
	scheduleGroups = [];
	excludeGroups = [];
	s = wwRest.getBranchVariable( branchId, "scheduleServGroups" );
	if ( s ) {
		numOfGroups = parseInt( s.value, 10 );
	} 
	 for (var j = 0; j <= numOfGroups; j++ ){
		var s = wwRest.getBranchVariable( branchId, "scheduleServGrp" + j );
		if ( s ) {
			scheduleGroups.push( s.value );
		} 
		s = wwRest.getBranchVariable( branchId, "scheduleServExclGrp" + j );
		if ( s ) {
			excludeGroups.push( s.value );
		} 
	 }
	getScheduleServices();
}
	
function getScheduleServices(){
	var s ;
	var scheduleValue ;
	var excludeValue;
	servicesSchedules = new Array();
	for (var i = 0 ; i < servicesToRetrieve.length ;i++ ) {
		scheduleValue="";
		excludeValue="9999";
		useTemplate = false;
		templatePage = "";
		s = wwRest.getBranchVariable(branchId, "serviceSchedule"+servicesToRetrieve[i]);
		if ( s != undefined ) { 
			scheduleValue = s.value ; 
			var t = scheduleValue.split( "@" );
			t = t[0].split( "|" );
			var u = parseInt( t[2], 10 ) ;
	
			if ( u > -1 
			//&& scheduleGroups.length > u
			) {

				scheduleValue = scheduleGroups[u];
				t = scheduleValue.split( "@" );
				t = t[0].split( "|" );
				templatePage = t[1];
				excludeValue = excludeGroups[u];
	
			} else {
				templatePage = t[1];
				s = wwRest.getBranchVariable(branchId, "serviceScheduleExclude"+servicesToRetrieve[i]);
				if ( s != undefined ) {
					if ( s.value != null && s.value != "null") {
						excludeValue = s.value ;
					}
				}
			}
		}
		if (scheduleValue != "") {
			var currentSchedule = {id:servicesToRetrieve[i], schedule: scheduleValue, exclude : excludeValue, page : templatePage};
			servicesSchedules.push( currentSchedule);
		}
	}
	checkScheduleTimer();
}

// get button object according to service id as set in	addAttr()	
//	var parent = $(window.parent.document);	
//	var objBtn = $(parent).find('div[service="' + services[i].id +'"][name="button"]')
function checkScheduleTimer() {
	setTimeout(checkScheduleTimer,checkScheduleTime);
	checkSchedule();
}	

function checkSchedule() {
// servicesSchedules contains the data for the buttons on the surface
// {id: 10, schedule: "---||-1@0|700|2200@1|700|2200@1|700|2200@1|700|2200@1|700|2200@1|700|2200@0|700|2200@-1@1|1|5", exclude: "0605,0705", page: ""}
	for (var i=0 ; i < servicesSchedules.length ; i++) {
		var q = (servicesSchedules[i].schedule).split('@');
		var s = (q[0]).split('|');
		serviceInactivePage = inactivePage;
		if (s[1] != ""){
			serviceInactivePage = s[1];
		}

		var smsSetting = q[9];
		var t = (servicesSchedules[i].exclude).split(',');
		var d = new Date();
		//-- current month of year --//
		var month = d.getUTCMonth() + 1;
		//-- current day of month --//
		var day = d.getUTCDate();
		var currentDate = day*100+month;
		var currentWeekday= d.getDay();
		var currentTime = d.getHours()*100+ d.getMinutes();
		var disableByDay = false;
		var disableByTime = true;
		//-- check exception dates --//
		for (j=0; j < t.length ; j++) {
			if (parseInt(t[j],10) == currentDate) {
				disableByDay = true;
			}
		}

		//-- check if disabled for this weekday --//
		if (currentWeekday == 7) {
			currentWeekday = 0;
		}

		var todaySchedule = q[currentWeekday+1].split("|");

		if (todaySchedule[0] == '0' ) {
			disableByDay = true;
		}
		
		for (var z = 1; z < todaySchedule.length ; z = z + 2 ){
			if (currentTime >= parseInt( todaySchedule[z], 10) && currentTime <= parseInt( todaySchedule[z+1], 10) ){
				disableByTime = false;
			}
		}
		
		if (disableByDay == true || disableByTime == true) {
			buttonDisable(servicesSchedules[i].id, smsSetting,serviceInactivePage);
		} else {
			buttonEnable(servicesSchedules[i].id, smsSetting);
		}
	}
}

function onScheduleChangeEvent(topic, publisherData, subscriberData) {
	getStoredSettings();
}
	