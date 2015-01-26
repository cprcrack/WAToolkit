/*
WhatsApp Toolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var debug = true;

var checkInterval = 10000;

// Prevent page exit confirmation dialog. The content script's window object is not shared: http://stackoverflow.com/a/12396221/423171
var scriptElem = document.createElement("script");
scriptElem.innerHTML = "window.onbeforeunload = null;"
document.head.appendChild(scriptElem);

chrome.runtime.sendMessage({ name: "getIsBackgroundPage" }, function (isBackgroundPage)
{
	if (isBackgroundPage)
	{
		if (debug) console.info("WAT: Background script injected");

		backgroundScript();
	}
	else
	{
		if (debug) console.info("WAT: Foreground script injected");

		foregroundScript();
	}
});

function backgroundScript()
{
	proxyNotifications();
	reCheckStatus();
}

function foregroundScript()
{

}

// FOR BACKGROUND SCRIPT /////////////////////////////////////////////////////////////////////////

function proxyNotifications()
{
	// The content script's window object is not shared: http://stackoverflow.com/a/12396221/423171

	window.addEventListener("message", function (event)
	{
		if (event != undefined && event.data != undefined && event.data.name == "backgroundNotificationClicked")
		{
			chrome.runtime.sendMessage({ name: 'backgroundNotificationClicked' });
		}
	}, false);
	
	var script =

	"var debug = " + debug + ";" +

	// Notification spec: https://developer.mozilla.org/en/docs/Web/API/notification

	// Save native notification
	"var _Notification = window.Notification;" +

	// Create proxy notification
	"var ProxyNotification = function (title, options)" + 
	"{" + 
		"if (debug) console.log('WAT: Notification creation intercepted');" +

		// Proxy constructor
		"var _notification = new _Notification(title, options);" + 

		// Proxy instance properties
		"this.title = _notification.title;" + 
		"this.dir = _notification.dir;" + 
		"this.lang = _notification.lang;" + 
		"this.body = _notification.body;" + 
		"this.tag = _notification.tag;" + 
		"this.icon = _notification.icon;" + 

		// Proxy event handlers
		"var that = this;" + 
		"_notification.onclick = function (event)" + 
		"{" + 
			"if (debug) console.log('WAT: Notification click intercepted with event: ' + JSON.stringify(event));" + 
			"that.onclick(event);" +
			"window.postMessage({ name: 'backgroundNotificationClicked' }, '*');" +
			"if (debug) console.log('Reached');" + 
		"};" + 
		"_notification.onshow = function (event)" + 
		"{" + 
			"if (debug) console.log('WAT: Notification show intercepted with event: ' + JSON.stringify(event));" + 
			"that.onshow(event);" + 
		"};" + 
		"_notification.onerror = function (event)" + 
		"{" + 
			"if (debug) console.log('WAT: Notification error intercepted with event: ' + JSON.stringify(event));" + 
			"that.onerror(event);" + 
		"};" + 
		"_notification.onclose = function (event)" + 
		"{" + 
			"if (debug) console.log('WAT: Notification close intercepted with event: ' + JSON.stringify(event));" + 
			"that.onclose(event);" + 
		"};" + 

		// Proxy instance methods
		"this.close = function ()" + 
		"{" + 
			"_notification.close();" + 
		"};" + 
		"this.addEventListener = function (type, listener, useCapture)" + 
		"{" + 
			"_notification.addEventListener(type, listener, useCapture);" + 
		"};" + 
		"this.removeEventListener = function (type, listener, useCapture)" + 
		"{" + 
			"_notification.removeEventListener(type, listener, useCapture);" + 
		"};" + 
		"this.dispatchEvent = function (event)" + 
		"{" + 
			"_notification.dispatchEvent(event);" + 
		"};" + 
	"};" + 

	// Proxy static properties
	"ProxyNotification.permission = _Notification.permission;" + 

	// Proxy static methods
	"ProxyNotification.requestPermission = _Notification.requestPermission;" + 

	// Replace native notification with proxy notification
	"window.Notification = ProxyNotification;";

	var scriptElem = document.createElement("script");
	scriptElem.innerHTML = script;
	document.head.appendChild(scriptElem);
}

function reCheckStatus()
{
	setTimeout(function () { checkStatus(); }, checkInterval);
}

function checkStatus()
{
	if (debug) console.info("WAT: Checking status...");

	try
	{
		// Should match definition of var isSessionReadyCode in background.js
		var isSessionReady = document.getElementsByClassName('pane-list-user').length > 0 || document.getElementsByClassName('entry-main').length > 0;
		if (isSessionReady)
		{
			if (debug) console.info("WAT: Session is ready");

			reCheckStatus(); return;
		}
		else
		{
			if (debug) console.warn("WAT: Session is not ready, checking if should reconnect...");

			chrome.runtime.sendMessage({ name: "getAttemptReconnect" }, function (attemptReconnect)
			{
				if (attemptReconnect)
				{
					if (debug) console.info("WAT: Reconnecting...");

					window.location.reload();
				}
				else
				{
					if (debug) console.info("WAT: Not attempting to reconnect");
				}

				reCheckStatus(); return;
			});
		}
	}
	catch (err)
	{
		console.error("WAT: Exception while checking status");
		console.error(err);
		
		reCheckStatus(); return;
	}
}

// FOR FOREGROUND SCRIPT /////////////////////////////////////////////////////////////////////////

