/*
Unofficial Toolkit for WhatsApp
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var debug = true;

var checkStatusInterval = 10000;
var checkSrcChatTrials = 25;
var checkSrcChatInterval = 400;
var checkBadgeInterval = 5000;

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
	proxyNotifications(true);
	reCheckStatus();
	reCheckBadge();
	setTimeout(function () { checkBadge(false); }, 1000);
	setTimeout(function () { checkBadge(false); }, 2000);
	setTimeout(function () { checkBadge(false); }, 3000);
}

function foregroundScript()
{
	proxyNotifications(false);
	reCheckSrcChat(1);
	reCheckBadge();
	setTimeout(function () { checkBadge(false); }, 1000);
	setTimeout(function () { checkBadge(false); }, 2000);
	setTimeout(function () { checkBadge(false); }, 3000);
}

// FOR BOTH BACKGROUND AND FOREGROUND SCRIPTS ////////////////////////////////////////////////////

function proxyNotifications(isBackgroundScript)
{
	// The content script's window object is not shared: http://stackoverflow.com/a/12396221/423171

	if (isBackgroundScript)
	{
		window.addEventListener("message", function (event)
		{
			if (event != undefined && event.data != undefined && event.data.name == "backgroundNotificationClicked")
			{
				chrome.runtime.sendMessage({ name: "backgroundNotificationClicked", srcChat: event.data.srcChat });
			}
		});
	}
	else
	{
		window.addEventListener("message", function (event)
		{
			if (event != undefined && event.data != undefined && (event.data.name == "foregroundNotificationClicked" || event.data.name == "foregroundNotificationShown"))
			{
				setTimeout(function () { checkBadge(false); }, 500);
				setTimeout(function () { checkBadge(false); }, 1000);
			}
		});
	}

	var script =

	"var debug = " + debug + ";" +
	"var isBackgroundScript = " + isBackgroundScript + ";" +

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
			"if (that.onclick != undefined) that.onclick(event);" +

			"if (isBackgroundScript)" +
			"{" +
				"var srcChat = undefined;" +
				"if (event != undefined && event.srcElement != undefined && typeof event.srcElement.tag == 'string')" +
				"{" +
					"if (debug) console.log('WAT: Background notification click intercepted with srcChat: ' + event.srcElement.tag);" + 

					"srcChat = event.srcElement.tag;" +
				"};" + 
				"window.postMessage({ name: 'backgroundNotificationClicked', srcChat: srcChat }, '*');" +
			"}" +
			"else" +
			"{" +
				"if (debug) console.log('WAT: Foreground notification click intercepted');" + 
				
				"window.postMessage({ name: 'foregroundNotificationClicked' }, '*');" +
			"};" +
		"};" + 
		"_notification.onshow = function (event)" + 
		"{" + 
			"if (that.onshow != undefined) that.onshow(event);" + 

			"if (!isBackgroundScript)" +
			"{" +
				"if (debug) console.log('WAT: Foreground notification show intercepted');" + 
				
				"window.postMessage({ name: 'foregroundNotificationShown' }, '*');" +
			"};" +
		"};" + 
		"_notification.onerror = function (event)" + 
		"{" + 
			"if (that.onerror != undefined) that.onerror(event);" + 
		"};" + 
		"_notification.onclose = function (event)" + 
		"{" + 
			"if (that.onclose != undefined) that.onclose(event);" + 
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

// FOR BACKGROUND SCRIPT /////////////////////////////////////////////////////////////////////////

function reCheckStatus()
{
	setTimeout(function () { checkStatus(); }, checkStatusInterval);
}

function checkStatus()
{
	if (debug) console.info("WAT: Checking status...");

	try
	{
		// Decides whether a background session is active
		var isSessionReady = document.getElementsByClassName("pane-list-user").length > 0 || document.getElementsByClassName("entry-main").length > 0;
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

function reCheckSrcChat(trial)
{
	setTimeout(function () { checkSrcChat(trial); }, checkSrcChatInterval);
}

function checkSrcChat(trial)
{
	try
	{
		var paramPrefix = "#watSrcChat=";
		var srcChat = window.location.hash;
		if (typeof srcChat == "string" && srcChat.indexOf(paramPrefix) == 0)
		{
			srcChat = srcChat.substr(paramPrefix.length).replace(/\./g, "-");

			if (debug) console.info("WAT: Searching chat " + srcChat + " trial " + trial + "...");

			var found = false;
			var chats = document.getElementsByClassName("chat");
			for (var i = 0; i < chats.length; i++)
			{
				var chat = chats[i];
				var dataReactId = chat.getAttribute("data-reactid")
				if ((typeof dataReactId == "string") && dataReactId.indexOf(srcChat) > -1)
				{
					chat.click();
					setTimeout(function() { window.scrollTo(0, 0); }, 500);
					setTimeout(function() { window.scrollTo(0, 0); }, 1000); // Fixes some strange page misposition that happens only sometimes
					found = true;
					break;
				}
			}

			if (found)
			{
				if (debug) console.info("WAT: Found and clicked chat");

				history.replaceState({}, document.title, "/");
			}
			else
			{
				if (trial < checkSrcChatTrials)
				{
					if (debug) console.warn("WAT: Chat not found");

					reCheckSrcChat(trial + 1);
				}
				else
				{
					if (debug) console.error("WAT: Chat not found");
				}
			}
		}
	}
	catch (err)
	{
		console.error("WAT: Exception while checking source chat");
		console.error(err);
	}
}

function reCheckBadge()
{
	setTimeout(function () { checkBadge(true); }, checkBadgeInterval);
}

function checkBadge(reCheck)
{
	if (debug) console.info("WAT: Checking badge...");
	
	try
	{
		var isSessionReady = document.getElementsByClassName("pane-list-user").length > 0;
		if (isSessionReady)
		{
			var totalUnreadCount = 0;
			var badgeTooltip = "";

			var unreadChatElems = document.getElementsByClassName("chat unread");
			for (var i = 0; i < unreadChatElems.length; i++)
			{
				unreadChatElem = unreadChatElems[i];
				var unreadCount = parseInt(unreadChatElem.getElementsByClassName("unread-count")[0].textContent);
				var chatTitle = unreadChatElem.getElementsByClassName("chat-title")[0].textContent;
				if (chatTitle.length > 30) // Max 30 chars
				{
					chatTitle = chatTitle.substr(0, 30 - 3) + "...";
				}
				var chatStatus = unreadChatElem.getElementsByClassName("chat-status")[0].textContent;
				if (chatStatus.length > 70) // Max 70 chars
				{
					chatStatus = chatStatus.substr(0, 70 - 3) + "...";
				}
				var chatTime = unreadChatElem.getElementsByClassName("chat-time")[0].textContent;
				totalUnreadCount += unreadCount;
				badgeTooltip += (i > 0 ? "\n" : "") + "(" + unreadCount + ")\t" + chatTitle + "  →  " + chatStatus + " [" + chatTime + "]";
			}

			var badgeText = "";
			if (totalUnreadCount > 0)
			{
				badgeText = totalUnreadCount.toString();
			}
			if (badgeTooltip.length == 0)
			{
				badgeTooltip = "All messages read";
			}
			chrome.runtime.sendMessage({ name: "setBadge", badgeText: badgeText, badgeTooltip: badgeTooltip });
		}
	}
	catch (err)
	{
		console.error("WAT: Exception while checking badge");
		console.error(err);
	}

	if (reCheck)
	{
		reCheckBadge();
	}
}
