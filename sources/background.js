/*
WhatsApp Toolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


// Open WhatsApp on toolbar icon click
chrome.browserAction.onClicked.addListener(function (tab)
{
    chrome.tabs.create({ url: "https://web.whatsapp.com" });
});

// Should match definition of var isSessionReady in script.js
var isSessionReadyCode = "document.getElementsByClassName('pane-list-user').length > 0 || document.getElementsByClassName('entry-main').length > 0;"; 

// Load background page
document.body.innerHTML = "<iframe src='https://web.whatsapp.com/'></iframe>";

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
}

function checkIfActiveSessions(tabs, callback)
{
	try
	{
		var _tabs = [];
		for (var i = 0; i < tabs.length; i++)
		{
			var tab = tabs[i];
			if (tab != undefined && tab.url != undefined && tab.url.indexOf("https://web.whatsapp.com") == 0)
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
