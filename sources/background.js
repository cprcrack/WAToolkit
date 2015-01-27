/*
Unofficial Toolkit for WhatsApp
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var whatsAppUrl = "https://web.whatsapp.com";
// Decides whether a foreground session is active
var isSessionReadyCode = "document.getElementsByClassName('pane-list-user').length > 0 || document.getElementsByClassName('entry-main').length > 0 || document.getElementsByClassName('spinner').length > 0;";

// Open WhatsApp on toolbar icon click
chrome.browserAction.onClicked.addListener(function (tab)
{
    chrome.tabs.create({ url: whatsAppUrl });
});

// Allow framing
if (false) chrome.webRequest.onHeadersReceived.addListener(
    function (details)
    {
    	var headers = details.responseHeaders;
        for (var i = headers.length - 1; i >= 0 ; i--)
        {
            var header = headers[i].name;
            if (header == "X-Frame-Options")
            {
                headers.splice(i, 1);
            }
        }
        return { responseHeaders: details.responseHeaders };
    },
    {
        urls: [ "*://*.whatsapp.com/*" ],
        types: [ "sub_frame" ]
    },
    ["blocking", "responseHeaders"]
);

// Load background page
document.body.innerHTML = "<iframe src='" + whatsAppUrl + "'></iframe>";

chrome.runtime.onMessage.addListener(onMessage);

// Handles data sent via chrome.runtime.sendMessage()
function onMessage(messageEvent, sender, callback)
{
	if (messageEvent.name == "getIsBackgroundPage")
	{
		callback(sender.tab == undefined);
	}
	else if (messageEvent.name == "getAttemptReconnect")
	{
		chrome.tabs.query({}, function (tabs)
		{
			checkIfActiveSessions(tabs, function (activeSessions)
			{
				callback(!activeSessions);
			});
		});
		return true; // Keep async callback valid: https://developer.chrome.com/extensions/runtime#event-onMessage
	}
	else if (messageEvent.name == "setBadge")
	{
		chrome.browserAction.setBadgeText({ text: messageEvent.badgeText });
	}
	else if (messageEvent.name == "backgroundNotificationClicked")
	{
		if (typeof messageEvent.srcChat == "string")
		{
			chrome.tabs.create({ url: whatsAppUrl + "#watSrcChat=" + messageEvent.srcChat });
		}
		else
		{
			chrome.tabs.create({ url: whatsAppUrl });
		}
	}
}

function checkIfActiveSessions(tabs, callback)
{
	try
	{
		var _tabs = [];
		for (var i = 0; i < tabs.length; i++)
		{
			var tab = tabs[i];
			if (tab != undefined && tab.url != undefined && tab.url.indexOf(whatsAppUrl) == 0)
			{
				_tabs.push(tab);
			}
		}
		if (_tabs.length > 0)
		{
			checkIfActiveTab(_tabs, 0, false, callback);
		}
		else
		{
			callback(false);
		}
	}
	catch (err)
	{
		console.error("WAT: Exception while checking active sessions");
		console.error(err);

		callback(true);
	}
}

function checkIfActiveTab(tabs, index, active, callback)
{
	chrome.tabs.executeScript(tabs[index].id, { code: isSessionReadyCode, allFrames: true }, function (results)
	{
		for (var i = 0; i < results.length; i++)
		{
			active = active || results[i];
		}
		if (active)
		{
			callback(true)
		}
		else if (index + 1 >= tabs.length)
		{
			callback(false)
		}
		else
		{
			checkIfActiveTab(tabs, index + 1, active, callback);
		}
	});
}
