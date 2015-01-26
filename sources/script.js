/*
WhatsApp Toolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var debug = true;

// Prevent page exit confirmation dialog (the content script's window object is not shared: http://stackoverflow.com/a/12396221/423171)
var scriptElem = document.createElement("script");
scriptElem.innerHTML = "window.onbeforeunload = null;"
document.head.appendChild(scriptElem);

chrome.runtime.sendMessage({ name: "getIsBackgroundPage" }, function (isBackgroundPage)
{
	if (isBackgroundPage)
	{
		if (debug) console.info("WAT: Script injected");

		reCheckStatus();
	}
	else
	{
		if (debug) console.info("WAT: Script injection cancelled");
	}
});

function reCheckStatus()
{
	setTimeout(function () { checkStatus(); }, 5000);
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
