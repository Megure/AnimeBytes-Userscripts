// ==UserScript==
// @name            AnimeBytes Snatched
// @namespace       animebytes.tv
// @description     Mark snatched torrents.
// @author          Chrome version by Mordred (original by jonls), ported to AB by ader10, fixes by Draconi
// @include         https://animebytes.tv/*
// @match           https://animebytes.tv/*
// @require         https://ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js
// @updateURL       https://dl.dropboxusercontent.com/u/4669554/ab/ab_snatched.user.js
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_deleteValue
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @grant           GM_log
// @version         1.1.3
// @date            2013-4-20
// ==/UserScript==

// TODO: full_update and fullUpdateStarted should be re-enabled as needed depending on version changes. Disabling due to lots of updates recently

// torrents.php - anime
// torrents2.php - music
// alltorrents.php - user's torrents

{
function addJQuery(callback) {
	var script = document.createElement("script");
	script.setAttribute("src", "//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js");
	script.addEventListener('load', function() {
		var script = document.createElement("script");
		script.textContent = "(" + callback.toString() + ")();";
		document.body.appendChild(script);
	}, false);
	document.body.appendChild(script);
}
// this code is used to get the server version so we can notify the user there is a new version available. The value returned from UserScript is stored in local storage
if( ! /opera/i.test(navigator.userAgent) ) {
	var now = new Date();
	var lastChecked = parseInt(GM_getValue('lastUpdateCheck', 0));
	req = GM_xmlhttpRequest({
		method: 'GET',
		url: 'https://dl.dropboxusercontent.com/u/4669554/ab/ab_snatched.user.js',
		onload: function (response) {
			GM_setValue("lastUpdateCheck", now.getTime().toString());	// don't check again until tomorrow
			if (response.status == 200) {
				var m = response.responseText.match(/@version\s+([^\s]+)/);
				if (m) {
					GM_setValue("serverVersion", m[1]);
				}
			}
		}
	});
	if( ! /firefox/i.test(navigator.userAgent) ) {	/* yes I know these three functions are also defined below. There are scoping issues at play here. */
		function GM_getValue(key, defaultValue) {
			var value = window.localStorage.getItem(key);
			if (value == null) {
				value = defaultValue;
			}
			return value;
		}
		function GM_setValue(key, value) {
			window.localStorage.setItem( key, value );
		}
	}
}

function main() {
	var CURRENT_VERSION = "1.1.3";	// used for check after update
	var SCRIPT_URL = "https://dl.dropboxusercontent.com/u/4669554/ab/ab_snatched.js";
	var SNATCHED_ICON = [
		'url(data:image/png;base64,',
		'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAABjFBMVEUAAAAyLiE3MBwtLSwsLCwq',
		'KiopKSkoKCgpKCclJSUkJCQjIyMiIiIhISEgICAdHR0cHBwaGhoXFxcUFBQuLi4wMDAxMTEzMzM0',
		'NDQ1NTU2NjY3Nzc4ODg5OTk8PDw+Pj4/Pz9BQUFCPjJHQjJHQS5TRRlbShZkUhppVx9kVSVkVCV3',
		'XReAYxOCZQ+EaBKJZguPZxGRahGMbRCMbhGSdBKYexefgyCghSSsiyS4iyG/mxvAnhzQqBvUqxvc',
		'tB/dtB/eth/ftx/psS7lszLesTbfpijeoiPdoCTdnyPboCTYoSfSmCHIiwrDjAu4gQmlewuicwmg',
		'cQmnhRWohhWehDaahDyUg0CWfjSPeTGhiDyiiT2sl0+umVOvnFivnFqynVW6nTjLqj/qxlfryFru',
		'zFzyzl3zz12/s3+4s4K6t4e/uIvPxZ7RzqvV1LTe1bne2b/Z3sPT4cTa5s7j5M/h6dXi69jp8OHt',
		'8ubu8+ju9On18+v09+/49/P4+vX7/Pr9/fz+/v3j3siBXQlzVAkh5lJcAAAAAXRSTlMAQObYZgAA',
		'ALtJREFUeNo9yDsLQWEcB+DfezsHAJKihBhQMhqV1Tcw+L5KFoNYDKQEJeG8tz8ZPOMDoPFT7/S7',
		'gERdnwKAPXuTnV/LWvSacZB3maCtjaTrdMOZt62c94pJJygSgkzT4rZ4SFs1w/ObkhqYb0tMDEbq',
		'+2OOw2aZ5grC++yQ3GOVcncRxEOFb9Ixqe9WxKzcJrik5zKjz45zyjejyp4qDRKes7wpdp06mKBM',
		'64tiKNhYSBRqFr3lFUDxD/gA0J9WTMGXxEkAAAAASUVORK5CYII=',
		')'
		//https://whatimg.com/i/xw6fo1.png
	].join('');
	var UPLOADED_ICON = [
		'url(data:image/png;base64,',
		'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAA21BMVEUAAAAUFBQXFxcaGhocHBwd',
		'HR0gICAhISEiIiIjIyMlJSUnJycoKCgpKSkqKiotLS0uLi4wMDAxMTEyMjIzMzM1NTU2NjY3Nzc5',
		'OTk8PDw+Pj4/Pz9BQUH////8/Pr1+fLt8+fj7NrZ5cyj3Vqi3Fmh2lig2Vid2VOb2U+U1keN0j+H',
		'0DZ/zDF5yittviVqvyJnvCFmuiFltyFyrRxrqBlkphVnoCFtpSVfmxxXlRdVmw5RnQZPoAZMowVK',
		'nwVTqQZZrAdPjhJHhRA/gwlAfg46dgt2vhB8wRJ/xhLaiOIUAAAAAXRSTlMAQObYZgAAAI5JREFU',
		'eNo9zrEOgzAMBFCfY2VFMBXRpYT//6VuhQGKxIIEzaWBVjzZ091wInK/iKg0+zKdlr0R1J/5Qagw',
		'6bM0TWsIXVGWRRfCmowE3+4l9VSB1AjMNgCDzUDU6GA9st7g4pGibX9/pAq/HenmoWc5QZEv5bIx',
		'gpqCUIlI4zq6/4xxZZ7pq9up8ioZLiJfc9pDpcOwDpgAAAAASUVORK5CYII=',
		')'
		//https://whatimg.com/i/8oux68.png
	].join('');
	var LEECHING_ICON = [
		'url(data:image/png;base64,',
		'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAA21BMVEUAAAAUFBQXFxcaGhocHBwd',
		'HR0gICAhISEiIiIjIyMlJSUnJycoKCgpKSkqKiotLS0uLi4wMDAxMTEyMjIzMzM1NTU2NjY3Nzc5',
		'OTk8PDw+Pj4/Pz9BQUH////8/Pr6XFv7Wlr9W1v6WFf3WVn+UFD8SUn6QED5Nzf5MTH7LCz1KCf1',
		'JCP2IiL6IyPwJB/sJB/vISHvIBznHhvqGxjaGBfLHBS8IhTBKRjFLxzINB/ULB+4Gw+xGA23EQu0',
		'DgqqFAulEgrBEw3cDAvaCwnjCwrZ5czj7Nrt8+f1+fI3g6qUAAAAAXRSTlMAQObYZgAAAI1JREFU',
		'eNo9zzESgkAQBMCZ2eVKShJM9QX+/zXEmhpBWXjcjZH2D5oA8WMQyqkAAD7r0RnDZZADjb2+amo8',
		'TTwb3LyOLRUK9ieuYYUyGkUTltkio1P0HS+ZPTI6ywRjxkqHorFstr0VtlCY5G7vJB0pUaVWuJBS',
		'clwoJw72ZSZxPd4VADCM+SRw+xce+AKRXjxgkh8RjQAAAABJRU5ErkJggg==',
		')'
		//https://whatimg.com/i/ay3zvb.png
	].join('');
	var BOOKMARKED_ICON = [
		'url(data:image/png;base64,',
		'iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAMAAAAolt3jAAAA51BMVEUAAAAUFBQXFxcaGhocHBwd',
		'HR0gICAhISEiIiIjIyMlJSUnJycoKCgpKSkqKiotLS0uLi4wMDAxMTEyMjIzMzM1NTU2NjY3Nzc5',
		'OTk8PDw+Pj4/Pz9BQUEiPvoqR/orSPoxTvoyT/ozUPo1U/o5V/s+XftacPhbcPhbcPlhd/hnfvlo',
		'fvlthfluhfl0jPl3j/l4j/l3kPl4kPlGVJJGVZI2QpI2QZIiM5QiM5MfMJMeMJMeL5McLZMbLZMa',
		'LJMZKpMYKZMZKpIVJpMVJpIPH5Lt8+fw9ezx9uzx9ez2+fP3+PP3+fP8/Ppw+FarAAAAAXRSTlMA',
		'QObYZgAAAIlJREFUeF49ysEKwkAMRdGXlxSdTaGCjlD//5+kui5QcCcKNYljAc/uwgUgfwDBbqib',
		'oSNEu8PJzmjm+bGSpT4NP3YsNCpStySVpt7SiYTB1TQixDNEKPHLTElHgp9UqicTrYDwlu0LxNWx',
		'RirJEH/f5P7yJCll0nXZl93iUxFgrH3Z9HVEc/kDvgzpOSbo/tFHAAAAAElFTkSuQmCC',
		')'
		//https://whatimg.com/i/4otnce.png
	].join('');
	var GROUP_SNATCHED = 'color: #E5B244 !important; background: ' + SNATCHED_ICON + ' font-style:italic; font-weight:bolder; text-decoration:underline;';
	var T_SNATCHED = 'color: #E5B244 !important; text-decoration:line-through !important; display:inline; background:' + SNATCHED_ICON + ' top right no-repeat; padding:0 18px 1px 0;';
	var UPLOADED = 'color: #63b708 !important; text-decoration:line-through !important; display:inline; background:' + UPLOADED_ICON + ' top right no-repeat; padding:0 18px 1px 0;';
	var LEECHING = 'color: #F70000 !important; display:inline; background:' + LEECHING_ICON + ' top right no-repeat; padding:0 18px 1px 0;';
	var SEEDING = 'color: #63b708 !important; font-style:italic; text-decoration:none !important;';
	var BOOKMARKED = 'background:' + BOOKMARKED_ICON + ' top right no-repeat; padding:0 18px 1px 0;';

	var HEADER_STYLE = '.sBoxTitle { color: white; } .sBoxTitle:visited { color: white; } .sboxTitleVersion { color: red; } .sboxTitleVersion:visited { color: red; }';
	var AUTO_UPDATE_INTERVAL = 20; /* minutes */
	var STATUS_BOX_YOFFSET = 20; /* pixels */

	var global_updateFreq = GM_getValue('update_freq', AUTO_UPDATE_INTERVAL);
	var global_hideStatusBox = GM_getValue('box_hidden', 'false');
	var global_SB_YOffset = GM_getValue('box_yoffset', STATUS_BOX_YOFFSET); 
	/* Inject CSS style */
	var style_groupsnatched = GM_getValue('style_groupsnatched',GROUP_SNATCHED);
	var style_tsnatched =	 GM_getValue('style_tsnatched',T_SNATCHED);
	var style_uploaded =	  GM_getValue('style_uploaded',UPLOADED);
	var style_leeching =	  GM_getValue('style_leeching',LEECHING);
	var style_seeding =	   GM_getValue('style_seeding',SEEDING);
	var style_bookmarked =	GM_getValue('style_bookmarked',BOOKMARKED);
	var scriptVersion =	   GM_getValue('script_version','0.0.0');
	GM_addStyle('.group_snatched { ' + style_groupsnatched + ' }');
	GM_addStyle('.wcds_snatched { ' + style_tsnatched + ' }');
	GM_addStyle('.wcds_uploaded { ' + style_uploaded + ' }');
	GM_addStyle('.wcds_leeching { ' + style_leeching + ' }');
	GM_addStyle('.wcds_seeding { ' + style_seeding + ' }');
	GM_addStyle('.wcds_bookmark { ' + style_bookmarked + ' }');
	GM_addStyle(HEADER_STYLE);
	GM_addStyle(".wcds_menu { background-color: rgba(40,40,40,0.96); position: fixed; z-index: 500; font-family: Arial, sans-serif; font-size: 11px !important; }")
	GM_addStyle(".wcds_button { cursor: pointer; margin-left:12px; float:right; -webkit-box-shadow:inset 0px 1px 0px 0px #ffffff; box-shadow:inset 0px 1px 0px 0px #ffffff; background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #343536), color-stop(1, #a3a3a3) ); background:-moz-linear-gradient( center top, #343536 5%, #a3a3a3 100% ); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#343536', endColorstr='#a3a3a3'); background-color:#343536; -webkit-border-radius:6px; border-radius:6px; border:1px solid #a1a1a1; display:inline-block; color:#a8a8a8; font-family:arial; font-size:15px; font-weight:bold; padding:6px 24px; text-decoration:none; text-shadow:1px 1px 0px #575757; }");
	GM_addStyle(".wcds_button:hover { background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #a3a3a3), color-stop(1, #343536) ); background:-moz-linear-gradient( center top, #a3a3a3 5%, #343536 100% ); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#a3a3a3', endColorstr='#343536'); background-color:#a3a3a3; }");
	GM_addStyle(".wcds_button:active { position:relative; top:1px; }");
	GM_addStyle(".wcds_sm_button { cursor: pointer; margin-right:5px; -webkit-box-shadow:inset 0px 1px 0px 0px #ffffff; box-shadow:inset 0px 1px 0px 0px #ffffff; background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #343536), color-stop(1, #a3a3a3) ); background:-moz-linear-gradient( center top, #343536 5%, #a3a3a3 100% ); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#343536', endColorstr='#a3a3a3'); background-color:#343536; -webkit-border-radius:3px; border-radius:3px; border:1px solid #a1a1a1; display:inline-block; color:#a8a8a8; font-family:arial; font-size: 10px; font-weight:bold; padding:3px 6px; text-decoration:none; text-shadow:1px 1px 0px #575757; }");
	GM_addStyle(".wcds_sm_button:hover { background:-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #a3a3a3), color-stop(1, #343536) ); background:-moz-linear-gradient( center top, #a3a3a3 5%, #343536 100% ); filter:progid:DXImageTransform.Microsoft.gradient(startColorstr='#a3a3a3', endColorstr='#343536'); background-color:#a3a3a3; }");
	GM_addStyle(".wcds_sm_button:active { position:relative; top:1px; }");
	GM_addStyle(".wcds_subItem { margin: 0px 5px 0px 25px; }");
	GM_addStyle(".wcds_numeric { padding: 2px !important; font-size: 9pt !important; }")
	GM_addStyle('.wcds_header { color:#ffffff !important; font-size: 11pt; }');//padding: 5px 0px; }');
	GM_addStyle('.wcds_text { width: 68% !important; margin-right:10px; padding: 2px !important; font-size: 9pt !important; }');
	GM_addStyle('.wcds_small_text { font-size: 10px; }');
	GM_addStyle('.wcds_link { margin-left:3px; margin-right:3px; }');
	GM_addStyle('.wcds_class { display: inline-block; width:93px; margin-left:25px; margin-bottom:9px; font-size:8pt;}');
	GM_addStyle('.wcds_leftCol { width:50%; height:auto; display:table-cell; padding: 10px 0px 10px; }');
	GM_addStyle('.wcds_rightCol { width:auto; height:auto; display:table-cell; padding: 10px 0px 10px; }');
	
	function log(text) {
		GM_log(text);
	}

	/* Throttled proxy */
	function Proxy(url_base, delay) {
		var last_req = new Date(0);
		var queue = [];
		var processing = false;

		return {
			get: function(req) {
				var now = new Date();
				queue.push(req);
				if (!processing) {
					/* Race condition: atomic test and set would be appropriate here, to ensure thread safety (is it a problem?) */
					processing = true;
					var diff = last_req.getTime() + delay - now.getTime();
					if (diff > 0) {
						var that = this;
						window.setTimeout(function() { that.process_queue(); }, diff);
					} else {
						this.process_queue();
					}
				}
			},

			process_queue: function() {
				var req = queue.shift();
				this.do_request(req);
				processing = (queue.length > 0);
				if (processing) {
					var that = this;
					window.setTimeout(function() { that.process_queue(); }, delay);
				}
			},

			do_request: function(req) {
				last_req = new Date();
				var timer;
				var req_timed_out = false; /* We cannot abort a request, so we need keep track of whether it timed out */

				/* Create timeout handler */
				timer = window.setTimeout(function() {
					/* Race condition: what if the request returns successfully now? */
					req_timed_out = true;
					if (req.error) req.error(null, 'Network timeout');
				}, req.timeout || 20000);

				/* Do the actual request */
				GM_xmlhttpRequest({
					method: req.method || 'GET',
					url: url_base+req.url,
					headers: { /*'User-Agent': navigator.userAgent,*/ 'Accept': req.accept || 'text/xml' },
					onload: function(response) {
						window.clearTimeout(timer);
						if (!req_timed_out) req.callback(response);
					},
					onerror: function(response) {
						window.clearTimeout(timer);
						if (!req_timed_out && req.error) req.error(response, 'GM_xmlhttpRequest error');
					}
				});
			}
		};
	}

	/* figures I check to see if this function has any use after I rewrite it to be better... no use yet */
	function cmpVersion(a, b) {
		/* returns 1 if a > b, -1 if a < b, 0 if a == b */
		if(a===b) return 0;
		var aParts = a.split('.');
		var bParts = b.split('.');
		for (var i = 0; i < Math.min(aParts.length, bParts.length); i++) {
			var aBits = aParts[i].match(/([0-9]+|[a-zA-Z])/g);
			var bBits = bParts[i].match(/([0-9]+|[a-zA-Z])/g);
			for (var j = 0; j < Math.min(aBits.length, bBits.length); j++) {
				if (aBits[j] < bBits[j]) return -1;
				if (aBits[j] > bBits[j]) return 1;
			}
			if (aBits.length < bBits.length) return -1;
			if (aBits.length > bBits.length) return 1;
		}
		if (aParts.length < bParts.length) return -1;
		if (aParts.length > bParts.length) return 1;
		return 0;
	}

	/* Global status area - feel free to reuse in your own scripts :)
	   Requires jQuery */
	function StatusBox(title, newVersion) {
		/* Setup status area */
		var status_area = $('#wcds_greasemonkey_status_area').eq(0);
		if (status_area.length == 0) {
			var statWidth = '20%';
			if (window.innerWidth < 1575)
				statWidth = 315;  // raised width to fit (no updates found) on one line
			status_area = $('<div id="wcds_greasemonkey_status_area"></div>').css({
				'position': 'fixed',
				'margin': global_SB_YOffset.toString() + 'px 20px',
				'width': statWidth,
				'z-index': 499
			});
			var boxPos = GM_getValue("box_position", "top_right");
			if (boxPos == "bottom_right")
				status_area.css({ 'bottom': '0', 'right': '0'});
			else if (boxPos == "top_left")
				status_area.css({ 'top': '0', 'left': '0'});
			else if (boxPos == "bottom_left")
				status_area.css({ 'bottom': '0', 'left': '0'});
			else /* top_right */
				status_area.css({ 'top': '0', 'right': '0'});
			$('body').append(status_area);
		}

		/* Create box */
		var box = $('<div id="status_content_area"></div>').hide();
		box.css({
			'color': 'white',
			'background-color': 'black',
			'opacity': 0.5,
			'margin': '0 0 10px 0',
			'padding': '10px 10px 20px 10px',
			'-webkit-border-radius': '10px',
			'border-radius': '10px'});
		if (newVersion == CURRENT_VERSION)
			box.append($('<div><a class="sBoxTitle" href='+SCRIPT_URL+' target="new">'+title+'</a></div>').css({'font-weight':'bold'}));
		else
			box.append($('<div><a class="sBoxTitle" href='+SCRIPT_URL+' target="new">'+title+' - <span class="sboxTitleVersion">Version '+newVersion+' available</span></a></div>').css({'font-weight':'bold'}));
		
		/* Create contents area */
		var contents = $('<div></div>');
		box.append(contents);

		var timer = null;
		var timeout = 0;
		var inhibit_fade = false;

		function set_visible(visible) {
			if (visible && box.is(':hidden')) box.fadeIn(500);				
			else if (!visible && box.is(':visible')) box.fadeOut(500);
		}

		function clear_timer() {
			if (timer) {
				window.clearTimeout(timer);
				timer = null;
			}
		}

		function set_timer() {
			if (!timer && timeout > 0) {
				timer = window.setTimeout(function() { clear_timer(); set_visible(false); }, timeout);
			}			
		}

		function update_timer(t) {
			clear_timer();
			timeout = t;
			if (!inhibit_fade) set_timer();
		}

		function set_inhibit_fade(inhibit) {
			inhibit_fade = inhibit;
			if (!inhibit_fade) { set_timer(); }
			else clear_timer();
		}

		/* Register event handlers */
		box.mouseenter(function(event) {
			set_inhibit_fade(true);
			jQuery(this).fadeTo(500, 0.8);
		});

		box.mouseleave(function(event) {
			set_inhibit_fade(false);
			jQuery(this).fadeTo(500, 0.5);
		});

		box.click(function(event) {
			clear_timer();
			jQuery(this).unbind('mouseenter');
			jQuery(this).unbind('mouseleave');
			set_visible(false);
		});

		/* Append to global status area */
		status_area.append(box);

		return {
			contents: function() {
				return contents;
			},

			show: function(t) {
				if (global_hideStatusBox != 'true' || newVersion != CURRENT_VERSION || /alltorrents\.php/.test(document.URL)) {
					t = t || 0;
					update_timer(t);
					set_visible(true);
				}
			},

			hide: function() {
				clear_timer();
				set_visible(false);
			}
		};
	}

	function doOptionsMenu() {
		var options_menu = $('#wcds_options_menu').eq(0);
		if (options_menu.length == 0) {
			optHeight = 570;
			optWidth = 820;
			options_menu = $('<div id="wcds_options_menu" class="wcds_menu"></div>').css({
				'top': window.innerHeight,
				'left': '50%',
				'margin-left': -optWidth*.5,
				'width': optWidth,
				'height': optHeight,
				'-webkit-border-radius': '10px',
				'border-radius': '10px'
			}).hide();
			css_div = $('<div></div>').css({
				'width': '95%', 'height':'auto','margin': '20px 20px 15px','color':'#ffffff'//,'overflow': 'hidden'
			});
			refreshHeader = $('<h3 class="wcds_header">Update Frequency</h3>');
			refreshInput = $('<input class="wcds_subItem wcds_numeric" type="text" name="interval" maxlength="3">Interval between updates in minutes (minimum of 10)<br>').css({'text-align':'right', 'width':'20px'});
			columns_div = $('<div></div>').css({ 'width':'100%', 'margin-top':'-18px', 'display':'table'});
			leftColumn = $('<div class="wcds_leftCol"></div>');
			leftColumn.append(refreshHeader);
			leftColumn.append(refreshInput);

			hideHeader = $('<h3 class="wcds_header">Visibility</h3>');
			check_box_hide = $('<input class="wcds_subItem" type="checkbox" name="visibility">Show the status box on all pages<br>');
			explanation_div = $('<div class="wcds_small_text wcds_subItem">The status box will always appear on \'/torrents.php?type=...\' and whenever a script update is available.</div>');
			leftColumn.append(hideHeader);
			leftColumn.append(check_box_hide);
			leftColumn.append(explanation_div);
			
			positionHeader = $('<h3 class="wcds_header">Status Box Position</h3>');
			radio_button_tl = $('<input class="wcds_subItem" type="radio" name="location" id="top_left"/>Top Left<br>');
			radio_button_tr = $('<input class="wcds_subItem" type="radio" name="location" id="top_right"/>Top Right<br>');
			radio_button_bl = $('<input class="wcds_subItem" type="radio" name="location" id="bottom_left"/>Bottom Left<br>');
			radio_button_br = $('<input class="wcds_subItem" type="radio" name="location" id="bottom_right"/>Bottom Right<br>');
			rightColumn = $('<div class="wcds_rightCol"></div>');
			rightColumn.append(positionHeader);
			rightColumn.append(radio_button_tl);
			rightColumn.append(radio_button_tr);
			rightColumn.append(radio_button_bl);
			rightColumn.append(radio_button_br);
			
			offsetHeader = $('<h3 class="wcds_header">Status Box Y-Offset</h3>');
			offsetInput = $('<input class="wcds_subItem wcds_numeric" type="text" name="yOffset" maxlength="3">The offset in pixels from the top or bottom of the window<br>').css({'text-align':'right', 'width':'20px'});
			rightColumn.append(offsetHeader);
			rightColumn.append(offsetInput);
			columns_div.append(leftColumn);
			columns_div.append(rightColumn);
			css_div.append(columns_div);

			full_div = $('<div></div>');		
			
			styleHeader = $('<h3 class="wcds_header">Link Style Settings</h3>');
			full_div.append(styleHeader);
			sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_gsnatched">Sample Group Snatched Torrent Link</a><br>');
			sampleText.click(function () { return false; });
			snatchedInput = $('<span class="wcds_class">.group_snatched</span><input class="wcds_text" type="text" id="input_gsnatched" value="'+ style_groupsnatched +'">');
			applyLink = $('<span class="wcds_sm_button">Test</span>');
			applyLink.click(function () { ApplyStyle('sample_gsnatched', 'input_gsnatched'); return false; });
			defaultLink = $('<span class="wcds_sm_button">Default</span>');
			defaultLink.click(function () {	SetStyle('sample_gsnatched', GROUP_SNATCHED); jQuery("input[id='input_gsnatched']").val(GROUP_SNATCHED); return false; });
			full_div.append(sampleText);
			full_div.append(snatchedInput);
			full_div.append(applyLink);
			full_div.append(defaultLink);
			
			sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_tsnatched">Sample Snatched Torrent Link</a><br>');
			sampleText.click(function () { return false; });
			snatchedInput = $('<span class="wcds_class">.wcds_snatched</span><input class="wcds_text" type="text" id="input_tsnatched" value="'+ style_tsnatched +'">');
			applyLink = $('<span class="wcds_sm_button">Test</span>');
			applyLink.click(function () { ApplyStyle('sample_tsnatched', 'input_tsnatched'); ApplyStyle('sample_seeding', 'input_tsnatched', 'input_seeding'); return false; });
			defaultLink = $('<span class="wcds_sm_button">Default</span>');
			defaultLink.click(function () { SetStyle('sample_tsnatched', T_SNATCHED); SetStyle('sample_seeding', T_SNATCHED + jQuery("input[id='input_seeding']").val()); jQuery("input[id='input_tsnatched']").val(T_SNATCHED); return false; });
			full_div.append(sampleText);
			full_div.append(snatchedInput);
			full_div.append(applyLink);
			full_div.append(defaultLink);
			
			sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_uploaded">Sample Uploaded Torrent Link</a><br>');
			sampleText.click(function () { return false; });
			snatchedInput = $('<span class="wcds_class">.wcds_uploaded</span><input class="wcds_text" type="text" id="input_uploaded" value="'+ style_uploaded +'">');
			applyLink = $('<span class="wcds_sm_button">Test</span>');
			applyLink.click(function () { ApplyStyle('sample_uploaded', 'input_uploaded'); ApplyStyle('sample_ul_seed', 'input_uploaded', 'input_seeding'); return false; });
			defaultLink = $('<span class="wcds_sm_button">Default</span>');
			defaultLink.click(function () { SetStyle('sample_uploaded', UPLOADED); SetStyle('sample_ul_seed', UPLOADED + jQuery("input[id='input_seeding']").val()); jQuery("input[id='input_uploaded']").val(UPLOADED); return false; });
			full_div.append(sampleText);
			full_div.append(snatchedInput);
			full_div.append(applyLink);
			full_div.append(defaultLink);
			
			//sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_seeding">Sample Seeding Snatched Torrent Link</a><span>&nbsp;&nbsp;(.wcds_snatched style is also applied to this link)</span><br>');
			//sampleTxt2 = $('<span class="wcds_class"></span><a href="#" id="sample_ul_seed">Sample Seeding Uploaded Torrent Link</a><span>&nbsp;&nbsp;(.wcds_uploaded style is also applied to this link)</span><br>');
			sampleText = $('<span class="wcds_class"></span>Seeding links will <i>always</i> have either the .wcds_snatched style or the .wcds_uploaded style applied<br><span class="wcds_class"></span>to them, so .wcds_seeding is commonly used to override those base styles.</br>');
			sampleTxt2 = $('<span class="wcds_class"></span><a href="#" id="sample_seeding">Sample Seeding Snatched Torrent Link</a>&nbsp;&nbsp;<a href="#" id="sample_ul_seed">Sample Seeding Uploaded Torrent Link</a><br>');
			//sampleText.click(function () { return false; });
			sampleTxt2.click(function () { return false; });
			snatchedInput = $('<span class="wcds_class">.wcds_seeding</span><input class="wcds_text" type="text" id="input_seeding" value="'+ style_seeding +'">');
			applyLink = $('<span class="wcds_sm_button">Test</span>');
			applyLink.click(function () { ApplyStyle('sample_seeding', 'input_tsnatched', 'input_seeding'); ApplyStyle('sample_ul_seed', 'input_uploaded', 'input_seeding'); return false; });
			defaultLink = $('<span class="wcds_sm_button">Default</span>');
			defaultLink.click(function () { SetStyle('sample_seeding', jQuery("input[id='input_tsnatched']").val() + SEEDING); jQuery("input[id='input_seeding']").val(SEEDING); 
											SetStyle('sample_ul_seed', jQuery("input[id='input_uploaded']").val() + SEEDING); return false; });
			full_div.append(sampleText);
			full_div.append(sampleTxt2);
			full_div.append(snatchedInput);
			full_div.append(applyLink);
			full_div.append(defaultLink);

			sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_leeching">Sample Leeching Torrent Link</a><br>');
			sampleText.click(function () { return false; });
			snatchedInput = $('<span class="wcds_class">.wcds_leeching</span><input class="wcds_text" type="text" id="input_leeching" value="'+ style_leeching +'">');
			applyLink = $('<span class="wcds_sm_button">Test</span>');
			applyLink.click(function () { ApplyStyle('sample_leeching', 'input_leeching'); return false; });
			defaultLink = $('<span class="wcds_sm_button">Default</span>');
			defaultLink.click(function () { SetStyle('sample_leeching', LEECHING); jQuery("input[id='input_leeching']").val(LEECHING); return false; });
			full_div.append(sampleText);
			full_div.append(snatchedInput);
			full_div.append(applyLink);
			full_div.append(defaultLink);

			// bookmarks all over
			//sampleText = $('<span class="wcds_class"></span><a href="#" id="sample_bookmarked">Sample Bookmarked Torrent Link</a><br>');
			//sampleText.click(function () { return false; });
			//snatchedInput = $('<span class="wcds_class">.wcds_bookmark</span><input class="wcds_text" type="text" id="input_bookmarked" value="'+ style_bookmarked +'">');
			//applyLink = $('<span class="wcds_sm_button">Test</span>');
			//applyLink.click(function () { ApplyStyle('sample_bookmarked', 'input_bookmarked'); return false; });
			//defaultLink = $('<span class="wcds_sm_button">Default</span>');
			//defaultLink.click(function () { SetStyle('sample_bookmarked', BOOKMARKED); jQuery("input[id='input_bookmarked']").val(BOOKMARKED); return false; });
			//full_div.append(sampleText);
			//full_div.append(snatchedInput);
			//full_div.append(applyLink);
			//full_div.append(defaultLink);
			css_div.append(full_div);

			okay_button = $('<span id="js_ok_button" class="wcds_button">Submit</span>');
			okay_button.click(function () { CommitOptions(); DisplaySlideMenu(false); });
			cancel_button = $('<span id="js_close_button" class="wcds_button">Cancel</span>');
			cancel_button.click(function () { DisplaySlideMenu(false); });
			button_div = $('<div></div>').css({
				'width': '95%', 'margin': '15px','overflow': 'hidden'
			});

			options_menu.append(css_div);
			button_div.append(cancel_button);
			button_div.append(okay_button);
			options_menu.append(button_div);
			$('body').append(options_menu);
		}
		else {
			// we already created the div
			var boxPos = GM_getValue('box_position', 'top_right');
			jQuery("input[name='location'][id='" + boxPos + "']").attr('checked','checked');
			if (global_hideStatusBox != 'true')
				jQuery("input[name='visibility']").attr('checked','checked');
			jQuery("input[name='interval']").val(global_updateFreq);
			jQuery("input[name='yOffset']").val(global_SB_YOffset);
			ApplyStyle('sample_gsnatched', 'input_gsnatched');
			ApplyStyle('sample_tsnatched', 'input_tsnatched');
			ApplyStyle('sample_uploaded', 'input_uploaded');
			ApplyStyle('sample_leeching', 'input_leeching');
			ApplyStyle('sample_seeding', 'input_tsnatched', 'input_seeding');
			ApplyStyle('sample_ul_seed', 'input_uploaded', 'input_seeding');
			//ApplyStyle('sample_bookmarked', 'input_bookmarked');
		}
	}
	
	function ApplyStyle(textControl, styleControl, styleControl2) {
		css_style = jQuery("input[id='" + styleControl + "']").val();
		if (styleControl2)
			css_style += jQuery("input[id='" + styleControl2 + "']").val();
		SetStyle(textControl, css_style);
	}
	
	function SetStyle(textControl, css_style) {
		jQuery("a[id='" + textControl + "']").removeAttr('style');
		jQuery("a[id='" + textControl + "']").attr('style',css_style);
	}

	function CommitOptions() {
		var locRadio = jQuery("input[name='location']:checked").attr('id');
		if (locRadio.length != 0)
			GM_setValue('box_position',locRadio);
		var boxHide = jQuery("input[name='visibility']:checked");
		if (boxHide.length != 0)
			GM_deleteValue('box_hidden');		
		else {
			GM_setValue('box_hidden','true');
			global_hideStatusBox = true;
			status.hide();
		}
		var updateFreq = jQuery("input[name='interval']").val();
		if (jQuery.isNumeric(updateFreq)) {
			if (updateFreq != AUTO_UPDATE_INTERVAL) {
				if (updateFreq < 10) updateFreq = 10;
				GM_setValue('update_freq', updateFreq);
			}
			else
				GM_deleteValue('update_freq');
		}
		var offset = jQuery("input[name='yOffset']").val();
		if (jQuery.isNumeric(offset) && offset >= 0) {
			if (offset != STATUS_BOX_YOFFSET) 
				GM_setValue('box_yoffset', offset);
			else
				GM_deleteValue('box_yoffset');
		}
		AddOrDeleteCustomStyle('input_gsnatched',  GROUP_SNATCHED, 'style_groupsnatched', '.group_snatched');
		AddOrDeleteCustomStyle('input_tsnatched',  T_SNATCHED,     'style_tsnatched',     '.wcds_snatched');
		AddOrDeleteCustomStyle('input_uploaded',   UPLOADED,       'style_uploaded',      '.wcds_uploaded');
		AddOrDeleteCustomStyle('input_leeching',   LEECHING,       'style_leeching',      '.wcds_leeching');
		AddOrDeleteCustomStyle('input_seeding',    SEEDING,        'style_seeding',       '.wcds_seeding');
		//AddOrDeleteCustomStyle('input_bookmarked', BOOKMARKED,     'style_bookmarked',    '.wcds_bookmark');
	}
	
	function AddOrDeleteCustomStyle(inputName, def_css, storageVal, className) {
		css = jQuery.trim(jQuery("input[id='" + inputName + "']").val());
		if (css == def_css) {	// if the current css stripped of whitespace equals the default style, delete the custom style
			GM_deleteValue(storageVal);
			css = def_css;
			}
		else 
			GM_setValue(storageVal, css);
		GM_addStyle(className + '{' + css + '}');	// updates the page without reloading (at least on chrome)
	}
	
	function DisplaySlideMenu(showMenu) {
		if (showMenu) {
			if (!slideMenuShowing) {
				slideMenuShowing = 1;
				jQuery('#wcds_options_menu').show().animate({
					top:'-=' + (jQuery('#wcds_options_menu').innerHeight()-10) + 'px'
				});
			}
		} else {
			slideMenuShowing = 0;
			jQuery('#wcds_options_menu').animate({
				top:'+=' + (jQuery('#wcds_options_menu').innerHeight()-10) + 'px'
			}, function () { jQuery('#wcds_options_menu').hide(); });
		}
	}
	/*****************************/
	/*** END OPTIONS PAGE CODE ***/
	/*****************************/
	
	/* Cache */
	function Cache(name, def_value) {
		var cache;
		return {
			serialize: function() {
				GM_setValue(name, JSON.stringify(cache));
			},
			unserialize: function() {
				cache = jQuery.parseJSON(GM_getValue(name, 'false'));
				if (!cache) cache = jQuery.extend({}, def_value); /* clone */
				return cache;
			},
			clear: function() {
				cache = jQuery.extend({}, def_value); /* clone */
				this.serialize();
			}
		};
	}

	function registerMenuCommand(oText, oFunc) {
		if(/firefox/i.test(navigator.userAgent))
			GM_registerMenuCommand(oText, oFunc);
		MenuCommandArray[MenuCommandArray.length] = [oText.replace("AnimeBytes Snatched: ",""),oFunc,oText.replace("AnimeBytes Snatched: ","").replace(" ","_")];
	}
	
	/************************************/
	/*** SCRIPT EXECUTION STARTS HERE ***/
	/************************************/

	/* Get animebytes.tv base URL */
	var whatcd_url_base = document.URL.match(/^https:\/\/animebytes.tv/);

	/* Create proxy */
	var whatcd_proxy = Proxy(whatcd_url_base, 1000);

	/* Get user id of this user */
	var whatcd_id = (function() {
		var m = $('#username_menu .username').eq(0).attr('href').match(/user\.php\?id=(\d+)/);
		if (m) return m[1];
		return null;
	})();

	if (!whatcd_id) return; /* Exceptional condition: User ID not found */

	/* Create status box */
	var server_version = GM_getValue("serverVersion", CURRENT_VERSION);
	var status = StatusBox('AnimeBytes Snatched', server_version);
	var options = doOptionsMenu();
	var slideMenuShowing = 0;

	/* Cache of snatched torrents */
	var snatch_cache = Cache('snatch_cache', { groups: {}, torrents: {} });
	var bookmark_cache = Cache('bookmark_cache', { groups: {} });

	var MenuCommandArray = [];
	var hasPageGMloaded = false;

	/* Reset command */
	registerMenuCommand('AnimeBytes Snatched: Reset Snatched', function() { snatch_cache.clear(); bookmark_cache.clear(); GM_setValue('last_update', '0'); GM_setValue('full_update','1'); GM_setValue('fullUpdateStarted','1'); location.reload(); });
	/* Update w/o clear */
	registerMenuCommand('AnimeBytes Snatched: Update', function() { GM_setValue('last_update', '0'); GM_setValue('full_update','1'); GM_setValue('force_all','1'); GM_setValue('fullUpdateStarted','1'); location.reload(); });	
	registerMenuCommand('AnimeBytes Snatched: Options', function() { DisplaySlideMenu(true); });

	doGMMenu();
	doOptionsMenu();

		/* Scan torrent table in doc and mark links as type in cache */
	function scan_torrent_page(doc, type) {
		//log(type);
		var torrent_table = jQuery(doc).find('#torrent_table').eq(0);
		if (torrent_table.length == 0) return 0;
		var found = 0;

		/* Old version: {"groups":{"2417":{"name":"pg.lost - Yes I Am"}}, "torrents":{941290:{type:"snatched", seeding:true}}} */
		/* New version: {"groups":{"2417":{"nm":"pg.lost - Yes I Am"}}, "torrents":{941290:{ty:"snatched", sd:1}}} // this was changed to save space */
		var d = snatch_cache.unserialize();
		torrent_table.find('tr.torrent > td:nth-child(2)').each(function(i) {
			/* Find group and torrent ID */
			var group_id;
			var torrent_id;

			var group_link = jQuery(this).find('a[title="View Torrent"]');
			var torrent_link = jQuery(this).find('a.dl_link');

			var group_match = group_link.attr('href').match(/torrents2?\.php\?id=(\d+)/);
			var torrent_match = torrent_link.attr('href').match(/torrents2?\.php.*\id=(\d+)/);

			if(group_match && torrent_match) {
				group_id = group_match[1];
				torrent_id = torrent_match[1];
			} else {
				status.contents().append('<div><span style="color: red;">Failed:</span> '+$(this).children('a:first').eq(1).text()+'</div>');
				z();	//intentional error out
			}

			/* Save in cache */
			// we are saving a type of "snatched" but when applying that class we have to apply it as "wcds_snatched" due to a What.CD having it's own .snatched style now
			if (!d.torrents[torrent_id] ||
					(type != 'seeding' && d.torrents[torrent_id].ty != type && !(type!='uploaded' && d.torrents[torrent_id].ty=='uploaded')) ||		// we have issues if you've snatched a torrent you uploaded, so uploaded takes precendence
					(type == 'seeding' && !d.torrents[torrent_id].sd)) {
				//var reg = jQuery(this).text().match(/.*\s]\s+(.+)\s(\[\d{4}\])\s-/);
				//if (!reg)
				//	reg = jQuery(this).text().match(/.*\s]\s+(.+)\s-?/);
				//var nm = jQuery.trim(reg[1]);
				
				// ugly stuff since I'm not proficient with jQuery
				var nm = '';
				var blocks = this.childNodes;
				for (var i = 0; i < blocks.length; i++) {
					nm += jQuery(blocks[i]).text()
					if (blocks[i].title === 'View Torrent') {
						break;
					}
				}
				nm = nm.trim()
				
				//trying alternate method
				//log(jQuery(this).clone().children('span, div, strong').remove().end().text());
				//var nm = jQuery.trim(jQuery(this).clone().children('span, div, strong').remove().end().text().match(/(.+)\s(\[|-)/)[1]);
				
				d.groups[group_id] = { nm: nm.replace(/"/g,"'") };
				if (type == 'seeding') { /* Special case seeding */
					if (d.torrents[torrent_id])
						d.torrents[torrent_id].sd = 1;
					else
						d.torrents[torrent_id] = { ty: 'seeding', sd: 1 };
				} else {
					if (d.torrents[torrent_id])
						d.torrents[torrent_id].ty = type;
					else 
						d.torrents[torrent_id] = { ty: type, sd: 0 };
				}
				//log ("adding:" + nm + " with group_id="+group_id+", torrent_id="+torrent_id);
				found += 1;
			}
		});

		if (found == 0) return 0;

		snatch_cache.serialize();
		return found;
	}
	
	// bookmarks are scary - not porting this yet
	function scan_bookmark_pages(doc) {
		// +2 stub of compatibility
	}
	//function scan_bookmark_page(doc) {
	//	//log ('scanning bookmark page');
	//	var torrent_table = jQuery(doc).find('#torrent_table').eq(0);
	//	if (torrent_table.length == 0) return 0;
	//	var found = 0;
	//
	//	bookmark_cache.clear();		// makes sense not to save bookmarks because they get added/removed a lot and it's just one page
	//	var b = bookmark_cache.unserialize();
	//	torrent_table.find('tr.group.discog').each(function(i) {
	//		/* Find group and torrent ID */
	//		var group_id;
	//		
	//		var link = jQuery(this).find('strong a:last').eq(0);
	//		var m = link.attr('href').match(/torrents\.php\?id=(\d+)/);
	//		if (m) {
	//			group_id = m[1];
	//			b.groups[group_id] = 1;
	//			found++;
	//			}
	//		//log (found + ". group_id:" + group_id + " - " + link.text());
	//	});
	//	torrent_table.find('tr.torrent').each(function(i) {	// single, non-music torrents show up not in a group
	//		/* Find group and torrent ID */
	//		var group_id;
	//		
	//		var link = jQuery(this).find('strong a:last').eq(0);
	//		var m = link.attr('href').match(/torrents\.php\?id=(\d+)/);
	//		if (m) {
	//			group_id = m[1];
	//			b.groups[group_id] = 1;
	//			found++;
	//			}
	//		//log (found + ". group_id:" + group_id + " - " + link.text());
	//	});
	//	bookmark_cache.serialize();
	//	return found;
	//}

	/* Fetch and scan all pages of type, call callback when done */
	function scan_all_torrent_pages(type, page_cb, finish_cb, forced_full) {
		var page = 1;
		var total = 0;
		var lastPage = 0;

		function request_url() {
			if (type == 'bookmark')
				return '/bookmarks.php';
			else
//x				return '/alltorrents.php?type='+type+'&userid='+whatcd_id+'&page='+page;
				return '/alltorrents.php?type='+type+'&userid='+whatcd_id+'&page='+page+'order_by=time&order_way=ASC';
		}

		function error_handler(response, reason) {
			status.contents().append('<div><span style="color: red;">Error:</span> Unable to fetch '+type+' page '+page+' ('+reason+')</div>');
			status.show();
			finish_cb(total);
		}

		function page_handler(response) {
			if (response.status == 200) {
				//pageText = response.responseText.replace(/collageShow.*\);/g,";");
				//log (pageText);
				var doc = document.implementation.createHTMLDocument('');
				doc.documentElement.innerHTML = response.responseText; //.replace(/<head>[\s\S]*<\/head>/,"<head><\/head>");
				
				page_cb(type, page);
				
				if (forced_full == 1) {
					lastPage = 1;
					jQuery(doc).find('#content .pagenums').eq(0).find('a:last').each(function(i) {
						var pgVal = jQuery(this).attr('href').match(/alltorrents\.php\?page=(\d+)/);
						lastPage = pgVal[1];
					});
				}
				if (type == 'bookmark')
					var found = scan_bookmark_page(doc);
				else
					var found = scan_torrent_page(doc, type);
				total += found;
				if ((found == 0 && forced_full == 0) || (forced_full == 1 && page >= lastPage) || (type == 'bookmark')) { finish_cb(type, total); return; } /* End of asynchronous chain */

				page += 1;
				whatcd_proxy.get({ url: request_url(), callback: page_handler, error: error_handler });
			} else {
				error_handler(response, 'HTTP '+response.status);
			}
		}
		whatcd_proxy.get({ url: request_url(), callback: page_handler, error: error_handler });
	}

	// not doing bookmarks and assume api is not publicly documented
//	function parse_json_api(type, page_cb, finish_cb) {
//		function error_handler(response, reason) {
//			status.contents().append('<div><span style="color: red;">Error:</span> Unable to fetch '+type+'s ('+reason+')</div>');
//			status.show();
//			finish_cb(total);
//		}
////		var start = Date.now();
//		// if the API gets expanded to other types, we won't hard code the URL here
//		jQuery.getJSON('/ajax.php?action=bookmarks&type=torrents', function (data) {
//			bookmark_cache.clear();		// we don't need to save the old bookmarks
//			var b = bookmark_cache.unserialize();
//			jQuery.each(data.response.bookmarks, function (key,val) {
//				b.groups[val.id] = 1;
//				//log("id:"+ val.id + " - name:" + val.name);
//			});
//			finish_cb(type, data.response.bookmarks.length);
//			bookmark_cache.serialize();
////			stop = Date.now();
////			log("AJAX:" + (stop - start) + "ms");
//		})
//		.fail(function(jqXHR, textStatus) {
//			error_handler("null",textStatus);
//		});
//	}

	/* Mark all links to torrents that are snatched/uploaded/leeching/seeding/bookmarked */
	function mark_snatched_links() {
		var d = snatch_cache.unserialize();
		var b = bookmark_cache.unserialize();

		/* Go through all links */
		jQuery('#content a').each(function(i) {
			var href = jQuery(this).attr('href');
			if (href) {
				var group_id;
				var torrent_id;

				/* Find and mark links to snatched torrents */
				if (!href.match(/#(?:post)?\d+/)) {
					// ignore pesky comment and description links
					var m = href.match(/torrents2?\.php\?id=(\d+)&torrentid=(\d+)/);
					if (m) {
						group_id = m[1];
						torrent_id = m[2];
					} else {
						m = href.match(/torrents2?\.php\?torrentid=(\d+)/);
						if (m) {
							torrent_id = m[1];
						} else {
							m = href.match(/torrents2?\.php\?id=(\d+)/);
							if (m) {
								group_id = m[1];
							}
						}
					}
				}

				/* Add classes */
				if (group_id && d.groups[group_id] &&
						(!torrent_id || !jQuery(this).parent().parent().is('.group_torrent')) &&
						(!torrent_id || !jQuery(this).parent().is('.torrent_properties')) &&
						!jQuery(this).parent().parent().parent().parent().parent().is('.pad')
						&& !jQuery(this).is('.post_id')) {
					jQuery(this).addClass('group_snatched');
				}
				// loituma
				//if (group_id && b.groups[group_id] && !(/what\.cd\/bookmarks\.php/.test(document.URL)) &&
				//		!(/what\.cd\/user\.php/.test(document.URL)) &&
				//		(!torrent_id || !jQuery(this).parent().parent().is('.group_torrent')) && !jQuery(this).is('.post_id')) {
				//	jQuery(this).addClass('wcds_bookmark');
				//}
				if (torrent_id && d.torrents[torrent_id]) {
					if (d.torrents[torrent_id].ty == 'snatched')
						jQuery(this).addClass('wcds_snatched');	// we can't use .snatched anymore because what has now added it's own .snatched class
					else if (d.torrents[torrent_id].ty == 'uploaded')
						jQuery(this).addClass('wcds_uploaded');
					else if (d.torrents[torrent_id].ty == 'leeching')
						jQuery(this).addClass('wcds_leeching');
					if (d.torrents[torrent_id].sd) { 
						if (d.torrents[torrent_id].ty != 'uploaded') { //x added a '{'
							jQuery(this).addClass('wcds_seeding wcds_snatched');	// we're really just marking seeding here, but you can't seed if you haven't snatched so adding that class as well
							jQuery(this).removeClass('wcds_leeching'); //x 
						}//x
						else
							jQuery(this).addClass('wcds_seeding');
						}
				}

				/* Change text if text is url */
				if (('/'+jQuery(this).text()) == jQuery(this).attr('href')
					&& group_id && d.groups[group_id] && d.groups[group_id].nm) {
					jQuery(this).text(d.groups[group_id].nm);
				}
			}
		});

		/* Mark links on album page in torrent table */
		if (/torrents\.php/.test(document.URL)) {
			/* Parse search */
			var search = {};
			var search_list = document.location.search.substring(1).split('&');
			for (var i = 0; i < search_list.length; i++) {
				var pair = search_list[i].split('=');
				search[pair[0]] = pair[1];
			}

			if (search.id) {
				/* Album page */
				jQuery('#content .torrent_table:first tr.group_torrent').each(function(i) {
					/* Find torrent id */
					var torrent_id;
					jQuery(this).find('td:first span:first a').each(function(i) {
						var href = jQuery(this).attr('href');
						if (href) {
							var m = href.match(/torrents2?\.php\?torrentid=(\d+)/);
							if (m) {
									// the permalink automatically gets the style applied to it, so we need to remove it here and then manually add it to the text below
									torrent_id = m[1];
									jQuery(this).removeClass('group_snatched wcds_snatched wcds_uploaded wcds_leeching wcds_seeding');
									return false;
							}
						}
					});

					if (torrent_id && d.torrents[torrent_id]) {
						var link = jQuery(this).find('td:first a:last');
						if (d.torrents[torrent_id].ty == 'snatched')
							link.addClass('wcds_snatched');	// we can't use .snatched anymore because what has now added it's own .snatched class
						else if (d.torrents[torrent_id].ty == 'uploaded')
							link.addClass('wcds_uploaded');
						else if (d.torrents[torrent_id].ty == 'leeching')
							link.addClass('wcds_leeching');
						if (d.torrents[torrent_id].sd) {
							if (d.torrents[torrent_id].ty != 'uploaded') 
								link.addClass('wcds_seeding wcds_snatched');	// we're really just marking seeding here, but you can't seed if you haven't snatched so setting that class too
							else
								link.addClass('wcds_seeding');
							}
					}
				});
			}
		}
		
		/* Show bookmark link on bookmarked album page */
		// nutella
		//if (/what\.cd\/torrents\.php\?id/.test(document.URL)) {
		//	var albumName = jQuery('#content > .thin > .header > h2 > span').eq(0);
		//	if (albumName) {
		//		var m = document.URL.match(/torrents\.php\?id=(\d+)/);
		//		if (m) {
		//			group_id = m[1];
		//			if (b.groups[group_id])
		//				albumName.addClass('wcds_bookmark');
		//		}
		//	}
		//}
	}

	/* Mark torrent as leeching when download link is clicked */
	function mark_download_links() {
		jQuery('#content').find('a').each(function(i) {
			var href = jQuery(this).attr('href');
			if (href) {
				/* Find download links */
				var m = href.match(/torrents2?\.php\?action=download&id=(\d+)/);
				if (m) {
					var torrent_id = m[1];
					jQuery(this).click(function(event) {
						var d = snatch_cache.unserialize();
						d.torrents[torrent_id] = { ty: 'leeching', sd: 0 };
						snatch_cache.serialize();
						mark_snatched_links();
					});
				}
			}
		});
	}

	// wolfenstein: enemy territory
	//function mark_bookmark_links() {
	//	jQuery('#content').find('a').each(function(i) {
	//		var id = jQuery(this).attr('id');
	//		if (id) {
	//			/* Find download links */
	//			var m = id.match(/bookmarklink_torrent_(\d+)/);
	//			if (m) {
	//				//log (m);
	//				var group_id = m[1];
	//				jQuery(this).click(function(event) {
	//					if (!/remove/i.test(jQuery(this).text()) && !/unbookmark/i.test(jQuery(this).text())) {
	//						var b = bookmark_cache.unserialize();
	//						b.groups[group_id] = 1;
	//						bookmark_cache.serialize();
	//						mark_snatched_links();
	//					} else {
	//						var b = bookmark_cache.unserialize();
	//						delete b.groups[group_id];
	//						bookmark_cache.serialize();
	//						jQuery('#content').find('a.wcds_bookmark').each(function(i) {
	//							var href = jQuery(this).attr('href');
	//							torrentString = 'torrents.php?id='+group_id;
	//							if (href && href=='torrents.php?id='+group_id) {
	//								jQuery(this).removeClass('wcds_bookmark');
	//							}
	//						});
	//						jQuery('#content > .thin > .header > h2 > span').eq(0).removeClass('wcds_bookmark');
	//					}
	//				});
	//			}
	//		}
	//	});
	//}

	/* This function was hacked from a generic one and converted to jQuery to work better with What.CD Snatched.
	   If you'd like to see that version it's here: http://userscripts.org/scripts/show/68559 */
	function doGMMenu() {
		// jQuery Version
		if( !MenuCommandArray.length ) { return; }
		var mdiv = $('<div></div>'); 
		$.each(MenuCommandArray, function(i, value) {
			if (i+1<MenuCommandArray.length)
				var mEntry = $('<span><a href="#" id="'+ MenuCommandArray[i][2] +'">' + MenuCommandArray[i][0] + '</a>\u00A0\u00A0|\u00A0\u00A0</span>');
			else
				var mEntry = $('<a href="#" id="'+ MenuCommandArray[i][2] +'">' + MenuCommandArray[i][0] + '</a>');
			mEntry.click(function () { MenuCommandArray[i][1](arguments[0]); var e = arguments[0]; e.stopPropagation(); return false; });
			mdiv.append(mEntry);
		});
		status.contents().append(mdiv);
	}
	
	/* Scan current page */
	if (/alltorrents\.php/.test(document.URL)) {
		/* Parse search */
		var search = {};
		var search_list = document.location.search.substring(1).split('&');
		for (var i = 0; i < search_list.length; i++) {
			var pair = search_list[i].split('=');
			search[pair[0]] = pair[1];
		}

		var full_update = GM_getValue('full_update','0');
		
//x		if ((search.type == 'snatched' || search.type == 'uploaded' || search.type == 'seeding' || search.type == 'leeching') && 
		if ((search.type == 'uploaded' || search.type == 'seeding' || search.type == 'leeching') && //x
				search.userid == whatcd_id && full_update == 0) {
			var scan_status = $('<div>Scanning current page... <span></span></div>');
			status.contents().append(scan_status);
			status.show();
			
			/* Scan current page */
			var found = scan_torrent_page(document, search.type);
			scan_status.children('span').text('Done ('+((found > 0) ? (found+' updates found') : 'no updates found')+')');
			status.show(5000);
		}
	}
	
	// osu!
	//if (/what\.cd\/bookmarks\.php(?!.action=edit)/i.test(document.URL)) {
	//	var scan_status = $('<div>Scanning current page... <span></span></div>');
	//	status.contents().append(scan_status);
	//	status.show();
	//	
	//	bookmark_cache.clear();
	//	var found = scan_bookmark_page(document);
	//	
	//	scan_status.children('span').text(((found > 0) ? (found+' bookmarks found') : 'no bookmarks found'));
	//	status.show(5000);
	//}

	/* Mark links */
	mark_download_links();
	//mark_bookmark_links();
	mark_snatched_links();
	
	/*******************************/
	/*** AUTO-UPDATE STARTS HERE ***/
	/*******************************/
	var now = new Date();
	var just_updated = 0;
	var last_update = parseInt(GM_getValue('last_update', '0'));
	var next_update = last_update + global_updateFreq*60*1000;
	var full_update = GM_getValue('full_update','0');
	var forced_full = GM_getValue('force_all','0');

	if (scriptVersion != CURRENT_VERSION) {
		log("Script was recently updated to " + CURRENT_VERSION);
		// the script was recently updated
		GM_setValue('script_version', CURRENT_VERSION);
		GM_deleteValue('custom_style');			// no longer used
		//GM_deleteValue('snatch_cache');		// Had to reset this due to changes in the cache structure. Will remove in a version or two.
		GM_deleteValue('serverVersion');		// we remove this just to make sure it will be properly retrieved in the future
		GM_deleteValue('lastUpdateCheck');
		GM_deleteValue('last_update');
		just_updated = 1;						// location.reload is called after we reach the end of this function so we don't want the script to continue executing before reloading first
		location.reload();
	}
	if (full_update == 1 /*&& !(/what\.cd\/torrents\.php/.test(document.URL))*/) {
		GM_deleteValue('full_update');
		GM_deleteValue('last_update');
		GM_deleteValue('force_all');
		next_update = 0;
		last_update = 0;
		}
	if (next_update < now.getTime() && just_updated!=1) {
		GM_setValue('last_update', now.getTime().toString());
		var fullUpdateFinished = GM_getValue('fullUpdateStarted', '0');
		var jobs = 5;
		var total_found = {};
		
		/* Show auto update status */
		last_update = 0;
		if (last_update == 0) {
			var update_status = {
//x				snatched: $('<div>Updating snatched: <span>Initializing...</span></div>'),
				uploaded: $('<div>Updating uploaded: <span>Initializing...</span></div>'),
				leeching: $('<div>Updating leeching: <span>Initializing...</span></div>'),
				seeding: $('<div>Updating seeding: <span>Initializing...</span></div>'),
				// trucks
				//bookmark: $('<div>Updating bookmarks: <span>Initializing...</span></div>'),
			};
			for (var type in update_status) status.contents().append(update_status[type]);
			status.show();
		}

		function scan_page_handler(type, page) {
			if (last_update == 0) {
				update_status[type].children('span').text('Page '+page+'...');
				status.show();
			}
		}

		function scan_finished_handler(type, found) {
			if (last_update == 0) {
				if (type != 'bookmark')
					update_status[type].children('span').text('Done ('+((found > 0) ? (found+' updates found') : 'no updates found')+')');
				else
					update_status[type].children('span').text('Done ('+((found > 0) ? (found+' bookmarks found') : 'no bookmarks found')+')');
			}

			jobs -= 1;
			total_found[type] = found;

			if (jobs == 0) {
				mark_snatched_links();
				if (last_update == 0) {
					var total = [];
					for (var type in total_found) 
						if (total_found[type] > 0) 
							total.push(type+': '+total_found[type]);
					status.contents().append('<div>Auto update done</div>');
					GM_deleteValue('fullUpdateStarted');
					status.show(5000);
				}
			}
		}

		/* Rescan all types of torrent lists */
		if (fullUpdateFinished == 1)
			forced_full = 1;
//x		scan_all_torrent_pages('snatched', scan_page_handler, scan_finished_handler, forced_full);
		scan_all_torrent_pages('uploaded', scan_page_handler, scan_finished_handler, forced_full);
		scan_all_torrent_pages('leeching', scan_page_handler, scan_finished_handler, forced_full);
		scan_all_torrent_pages('seeding',  scan_page_handler, scan_finished_handler, forced_full);
		//scan_all_torrent_pages('bookmark', scan_page_handler, scan_finished_handler, forced_full);
		
		//parse_json_api('bookmark', scan_page_handler, scan_finished_handler);
	}

	/**********************************/
	/*** SCRIPT EXECUTION ENDS HERE ***/
	/**********************************/

	/*** Functions for Chrome ***/
	function quoteString(string){
		if(string.match(_escapeable)) {
		return'"'+string.replace(_escapeable,function(a){
			var c=_meta[a];
			//log(c + " - " + string);  // this was spitting out a bunch of logged stuff whenever there was a '\' in the torrent name
			if(typeof c==='string')return c;
			c=a.charCodeAt();
			return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);})+'"';
		}return'"'+string+'"';
	};
	var _escapeable=/["\\\x00-\x1f\x7f-\x9f]/g;
	var _meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};

	if( ! /firefox/i.test(navigator.userAgent)) {
		if (typeof GM_addStyle == 'undefined' ) {
			function GM_addStyle(css) {
				jQuery("<style type='text/css'>"+css+"</style>").appendTo('head');
			}
		}
		function GM_getValue (key, defaultValue) {
			var value = window.localStorage.getItem(key);
			if (value == null) {
				value = defaultValue;
			}
			return value;
		}
		function GM_setValue(key, value) {
			window.localStorage.setItem( key, value );
		}
		function GM_deleteValue(key) {
			window.localStorage.removeItem( key );
		}
		
		function GM_xmlhttpRequest(details) {
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				var responseState = {
					responseXML:(xmlhttp.readyState==4 ? xmlhttp.responseXML : ''),
					responseText:(xmlhttp.readyState==4 ? xmlhttp.responseText : ''),
					readyState:xmlhttp.readyState,
					responseHeaders:(xmlhttp.readyState==4 ? xmlhttp.getAllResponseHeaders() : ''),
					status:(xmlhttp.readyState==4 ? xmlhttp.status : 0),
					statusText:(xmlhttp.readyState==4 ? xmlhttp.statusText : '')
				}
				if (details["onreadystatechange"]) {
					details["onreadystatechange"](responseState);
				}
				if (xmlhttp.readyState==4) {
					if (details["onload"] && xmlhttp.status>=200 && xmlhttp.status<300) {
						details["onload"](responseState);
					}
					if (details["onerror"] && (xmlhttp.status<200 || xmlhttp.status>=300)) {
						details["onerror"](responseState);
					}
				}
			}
			try {
			  //cannot do cross domain
			  xmlhttp.open(details.method, details.url);
			} catch(e) {
			  if( details["onerror"] ) {
				//simulate a real error
				details["onerror"]({responseXML:'',responseText:'',readyState:4,responseHeaders:'',status:403,statusText:'Forbidden'});
			  }
			  return;
			}
			if (details.headers) {
				for (var prop in details.headers) {
					xmlhttp.setRequestHeader(prop, details.headers[prop]);
				}
			}
			xmlhttp.send((typeof(details.data)!='undefined')?details.data:null);
		}
		function GM_log(message) { 
			console.log(message); 
		}
	}
	jQuery.noConflict();
}

// load jQuery and execute the main function
if( /opera/i.test(navigator.userAgent)) {
	console.log("AnimeBytes Snatched: If this script is not working in Opera, make sure the filename ends in user.js");
	addJQuery(main);
}
else if( ! /firefox/i.test(navigator.userAgent) ) {	// chrome and safari
	addJQuery(main);
	}
else {
	this.$ = this.jQuery = jQuery.noConflict(true);
	main();
}
}