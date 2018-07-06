// version 7.0.2.02
// 20150529 - BvD 5.4.2
//			- First version with SMS
// 20150722 - BvD 5.4.3
//			- added support for extended button
// 20150827 - BvD 5.4.4
//			- several performance improvements ( see below )
//			- Placing the keyboard related object in variables onload to decrease the search time on change
//          - keeping the status of the addbutton in memory to avoid unnecessary css changes
//          - keeping the status of the service buttons in memory to avoid unnecessary css changes
// 20170504 - BvD 5.4.5
//          - added fastclick library to improve the click speed on a iPad
// 20170531	- Annbol 5.4.6
//			- Added parameter "Country Code". This can be used to add a predefined country code to the entered phone number.
// 			  The surface application may show the predefined country code somewhere. If entered, it will be automatically added
//			  in front of the entered phone number
// 20180302 - BvD 6.2.6
//          - Make sure to catch values from the appcache and add them to the create
// 20180923 - BvD 6.2.0.10
//			- corrected scheduleversion check
//			- solved issue that the service  off was noticed 1 minute later
//			- decreased time check to 10 seconds.
// 20180503 - BvD 7.0.2.01
//			- match version number with schedule UI
//			- upgraded to new format
//			- if value for SMS is set to -1, than the keyboard will always be shown
//			- check if var exists if not try to get var from Central
//			- use page for close from Schedule admin if set
//			- write to log if Schedule values cannot be found
//          - closed on added max tickets reached
// 20180607 - BvD 7.0.2.02
//			- implemented buttonclickdelay to avoid double click. Value comes from utt

var branchId = -1;
var unitId = "";
var deviceType;
var wwClient = qmatic.webwidget.client;
var wwRest = qmatic.connector.client;

var inputId = "";
var maxInput = 5;
var minInput = 3;
var addBtnId = "";
var skipBtnId = "";
var skip2BtnId = "";
var inputValue = "";
var field = "phoneNumber";
var startPage = "";
var buttonTimeDelay = 2; // in seconds

var inactiveImage = "";
var buttonHide = false;
var inactivePage = "";
var maxTicketPage = "";
var inputPage = "";
var printServiceId = -1;
var printHref = "";
var printQueueId = -1;
var printDivId = -1;
var parentMain;
var objBtnInput;
var objBtnAdd;
var objBtnMsg;
var foundBtnAdd = false;
var cacheLang = "";
var cacheLevel = "";
var cacheCustom1 = "";
var cacheCustom2 = "";
var cacheCustom3 = "";
var cacheCustom4 = "";
var cacheCustom5 = "";
var clearInterval = 120;
var countryCode = "";
var agentIdSplit = "@@@";


var controller = ( function ( $ ) {
	var attributeDefaults = {},
		//-- CSS <=> XML mapping --//
		attributeKeys = {
		};

	// Public contents of controller
	return {
		onLoaded: function( configuration ) {
			//-- gets the configuration information from the surface application --//
			var attr = configuration.attributes,
			attribParser = new qmatic.webwidget.AttributeParser( attr || {} ),
			defaultsParser = new qmatic.webwidget.AttributeParser( attributeDefaults ),
			ak = attributeKeys,
			// Other text font and colour
			textFont = parseFontInfo( attribParser.getString( 'text.font', 'Helvetica;36px;normal;normal' ), 'object' ),
			textColor = attribParser.getString( 'text.color', '#000000' ),
			//-- background --//
			backgroundColor = attribParser.getString( 'bg.color', '' ),
			btnImage = attribParser.getImageUrl( 'key.image', '' ),
			btnDelImage = attribParser.getImageUrl( 'keydel.image', '' );
			//-- text variables --//
			inputId = attribParser.getString( 'input.element', '' );
			addBtnId = attribParser.getString( 'add.btn.element', '' );
			skipBtnId = attribParser.getString( 'skip.btn.element', '' );
			skip2BtnId = attribParser.getString( 'skip2.btn.element', '' );
			maxInput = attribParser.getInteger( 'max.input', 10 );
			minInput = attribParser.getInteger( 'min.input', 5 );
			field = attribParser.getString( 'visit.field', 'phoneNumber' );
			countryCode = attribParser.getString( 'country.code', '' );
			// -- services info --//
			inactiveImage = attribParser.getImageUrl( 'btn.inact.img', "" );
			buttonHide = attribParser.getBoolean( 'btn.hide', false );
			inactivePage = attribParser.getString( 'page.inact.name', "" );
			inputPage = attribParser.getString( 'page.input.name', "" );
			if ( btnImage != "" ) {
				if ( btnDelImage == "" ) {
					btnDelImage = btnImage;
				}
				// image present, remove border etc
				for ( var i = 1; i < 13; i++ ) {
					$( '#key' + i ).css( 'background-color', 'transparent' );
					$( '#key' + i ).css( 'border', 'transparent' );
					$( '#key' + i ).css( 'border-top-left-radius', '0px' );
					$( '#key' + i ).css( 'border-bottom-right-radius', '0px' );
					$( '#key' + i ).css( '-webkit-border-top-left-radius', '0px' );
					$( '#key' + i ).css( '-webkit-border-bottom-right-radius', '0px' );
					$( '#key' + i ).css( '-moz-border-radius-topleft', '0px' );
					$( '#key' + i ).css( '-moz-border-radius-bottomright', '0px' );

					if ( i > 10 ) {
						$( '#key' + i ).css( 'background-image', 'url( ' + btnDelImage + ' )' );
					} else {
						$( '#key' + i ).css( 'background-image', 'url( ' + btnImage + ' )' );
					}
				}
				setKeySize( btnImage );
			}

			for ( var i = 1; i < 13; i++ ) {
				$( '#key' + i ).css( 'color', textColor );
				$( '#key' + i ).css( textFont );
			}

			// set widget background colour
			$( 'body:first' ).css( 'background-color', backgroundColor );

			branchId = wwClient.getBranchId();
			unitId = wwClient.getUnitId();
			// loading all objects for the keyboard;
			parentMain = $( window.parent.document );
			objBtnInput = $( parentMain ).find( 'div[id="' + inputId + '"]' );
			if ( window.parent.document.getElementById( addBtnId ) ){
				foundBtnAdd = true;
				objBtnAdd = $( parentMain ).find( 'div[id="' + addBtnId + '"]' );
			}

			var fullUnitId = wwClient.getUnitAndDeviceId();
			fullUnitId = fullUnitId.split(":");
			if ( fullUnitId.length > 2) {
				deviceType = fullUnitId[2];
			}

			addClickToFunctionBtn();
			reset();
			getUnitParams();
			getServices();

			startPage = parent.$( '#pages' ).children( ':visible' );
			startPage = startPage.attr( 'name' );

			wwClient.subscribe( 'com.qmatic.qp.topic.event.SCHEDULE_CHANGED', onScheduleChangeEvent );
			wwClient.subscribe( "com.qmatic.qp.topic.event.SWITCH_HOST_PAGE_COMPLETE",reset );
			wwClient.subscribe( 'com.qmatic.qp.topic.operation.PUT_CACHE',appCacheSet );
			wwClient.subscribe( 'com.qmatic.qp.topic.operation.CLEAR_CACHE',appCacheClear );

			$( function() {
				FastClick.attach( document.body );
			} );

		},

		onLoadError: function( message ) {
			$( 'body' ).html( '<p>Widget load error: ' + message + '</p>' );
		}
	};
	
	function appCacheSet( topic, eventData, subscriberData ) {
		if ( eventData.key == "custom1" ) {
			cacheCustom1 = eventData.value;
		}

		if ( eventData.key == "custom2" ) {
			cacheCustom2 = eventData.value;
		}

		if ( eventData.key == "custom3" ) {
			cacheCustom3 = eventData.value;
		}

		if ( eventData.key == "custom4" ) {
			cacheCustom4 = eventData.value;
		}
		
		if ( eventData.key == "custom5" ) {
			cacheCustom5 = eventData.value;
		}
		if ( eventData.key == "level" ) {
			cacheLevel = eventData.value;
		}
		setTimeout( appCacheClear, clearInterval * 1000 );
	}
	
	function appCacheClear( topic, eventData, subscriberData ) {
		cacheLang = "";
		cacheLevel = "";
		cacheCustom1 = "";
		cacheCustom2 = "";
		cacheCustom3 = "";
		cacheCustom4 = "";
		cacheCustom5 = "";
	}
	
	function setKeySize( imgSrc ){
		var tempImage1 = new Image();
		tempImage1.src = imgSrc;
		tempImage1.onload = function() {
			for ( var i = 1; i < 13; i++ ) {
				$( '#key' + i ).css( 'width', tempImage1.width );
				$( '#key' + i ).css( 'height', tempImage1.height );
				$( '#key' + i ).css( 'line-height', tempImage1.height + "px" );
			}
		}
	}

	function addClickToFunctionBtn() {
		if ( window.parent.document.getElementById( addBtnId ) ) {
			window.parent.document.getElementById( addBtnId ).addEventListener( 'click', executeAddBtn, false );
		}
		if ( window.parent.document.getElementById( skipBtnId ) ) {
			window.parent.document.getElementById( skipBtnId ).addEventListener( 'click', executeSkipBtn, false );
		}
		if ( window.parent.document.getElementById( skip2BtnId ) ) {
			window.parent.document.getElementById( skip2BtnId ).addEventListener( 'click', executeSkipBtn, false );
		}
	}

	function executeAddBtn() {
		if ( inputValue.length >= minInput && inputValue.length <= maxInput ) {
			printTicket( true );
		}
	}

	function executeSkipBtn() {
		printTicket( false );
	}
	
	function parseFontInfo( font_info, type ) {
		var css = font_info.split( ';' );

		if ( !type )
			var type = 'string';

		var result = null;
		switch ( type ) {
		case 'string':
			result = 'font-family:' + css[0] + ';font-size:' + css[1] + ';font-style:' + css[2] + ';font-weight:' + css[3];
			break;
		case 'object':
			result = {
				'font-family': css[0],
				'font-size': css[1],
				'font-style': css[2],
				'font-weight': css[3]
			}
			break;
		}
		return result;
	}
	
	function getUnitParams() {
		var unitParams = wwRest.getEntryPointByUnitId(unitId);
		if ( unitParams.parameters.buttonTimeDelay != undefined) {
			buttonTimeDelay = parseInt(unitParams.parameters.buttonTimeDelay , 10);
		}
	}

} )( jQuery );
