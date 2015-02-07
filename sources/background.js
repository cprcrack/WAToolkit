/*
WAToolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var debug = false;

var whatsAppUrl = "https://web.whatsapp.com/";
var newTabUrl = "chrome://newtab/";

// Default options, should match the ones defined in script.js
var backgroundNotif = true;
var wideText = false;

// Allow framing // and external resources
chrome.webRequest.onHeadersReceived.addListener(
    function (details)
    {
        var headers = details.responseHeaders;
        for (var i = headers.length - 1; i >= 0 ; i--)
        {
            if (headers[i].name == "X-Frame-Options") // || headers[i].name == "Content-Security-Policy"
            {
                headers.splice(i, 1);
            }
        }
        return { responseHeaders: headers };
    },
    {
        urls: [ "*://*.whatsapp.com/*" ],
        types: [ "main_frame", "sub_frame" ]
    },
    ["blocking", "responseHeaders"]
);

// Ensure that one and only one WhatsApp tab or background page is open at any time

var isBackgroundPageLoaded = false;
var whatsAppTabs = [];

updateWhatsAppTabs(function ()
{
    if (whatsAppTabs.length == 0)
    {
        if (debug) console.info("WAT: There were no WhatsApp tabs on startup, load background page");
        
        loadBackgroundPage();
    }
    else if (whatsAppTabs.length == 1)
    {
        if (debug) console.info("WAT: There was one WhatsApp tab on startup, do nothing");
    }
    else
    {
        if (debug) console.info("WAT: There were more than one WhatsApp tabs on startup, close all but the last one");
        
        closeAllWhatsAppTabsBut(whatsAppTabs[whatsAppTabs.length - 1]);
    }
});

chrome.runtime.onInstalled.addListener(function (details)
{
    if (details.reason == "install")
    {
        updateWhatsAppTabs(function ()
        {
            var closedCount = closeAllWhatsAppTabs();
            if (closedCount > 0)
            {
                if (debug) console.info("WAT: There were WhatsApp tabs on install, open a new one");

                chrome.tabs.create({ url: whatsAppUrl });
            }
            else
            {
                if (debug) console.info("WAT: There were no WhatsApp tabs on install, load background page");

                loadBackgroundPage();
            }
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab)
{
    if (typeof changeInfo.url == "string")
    {
        if (changeInfo.url.indexOf(whatsAppUrl) == 0 && whatsAppTabs.indexOf(tabId) == -1)
        {
            if (debug) console.info("WAT: New WhatsApp tab, close all other WhatsApp tabs or background page");
            
            whatsAppTabs.push(tabId);
            closeAllWhatsAppTabsBut(tabId);
            unloadBackgroundPage();
        }
        else if (changeInfo.url.indexOf(whatsAppUrl) != 0 && whatsAppTabs.indexOf(tabId) > -1)
        {
            if (debug) console.info("WAT: 'Closed' the only WhatsApp tab, load background page");
            
            whatsAppTabs.splice(whatsAppTabs.indexOf(tabId), 1);
            loadBackgroundPage();
        }
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo)
{
    if (whatsAppTabs.indexOf(tabId) > -1)
    {
        if (debug) console.info("WAT: Closed the only WhatsApp tab, load background page");
        
        whatsAppTabs.splice(whatsAppTabs.indexOf(tabId), 1);
        loadBackgroundPage();
    }
});

// Handle toolbar icon click. Focus WhatsApp tab if currently open in this window, otherwise just open a new one or use the currently active new tab page.
chrome.browserAction.onClicked.addListener(function (tab)
{
    chrome.tabs.query({ url: whatsAppUrl + "*", lastFocusedWindow: true }, function (tabs)
    {
        if (tabs.length > 0)
        {
            chrome.tabs.update(tabs[0].id, { active: true });
        }
        else if (tab.url == newTabUrl)
        {
            chrome.tabs.update(tab.id, { url: whatsAppUrl });
        }
        else
        {
            chrome.tabs.create({ url: whatsAppUrl });
        }
    });
});

function loadBackgroundPage()
{
    if (!isBackgroundPageLoaded)
    {
        isBackgroundPageLoaded = true;
        document.body.innerHTML = "<iframe width='1000' height='10000' src='" + whatsAppUrl + "'></iframe>"; // Big height makes all chats to be loaded in the side panel's DOM
    }
}

function unloadBackgroundPage()
{
    if (isBackgroundPageLoaded)
    {
        isBackgroundPageLoaded = false;
        document.body.innerHTML = "";
    }
}

function updateWhatsAppTabs(callback)
{
    chrome.tabs.query({ url: whatsAppUrl + "*" }, function (tabs)
    {
        whatsAppTabs = [];
        for (var i = 0; i < tabs.length; i++)
        {
            whatsAppTabs.push(tabs[i].id);
        }

        if (debug) console.info("WAT: Updated WhatsApp tabs: " + JSON.stringify(whatsAppTabs));

        callback();
    });
}

// Returns the number of tabs that will be closed (the method is async).
function closeAllWhatsAppTabs()
{
    return closeAllWhatsAppTabsBut(-1);
}

// Pass -1 to close all tabs. Returns the number of tabs that will be closed (the method is async).
function closeAllWhatsAppTabsBut(whatsAppTabToKeep)
{
    var removedWhatsAppTabs = [];
    for (var i = whatsAppTabs.length - 1; i >= 0; i--)
    {
        var whatsAppTab = whatsAppTabs[i];
        if (whatsAppTab != whatsAppTabToKeep)
        {
            removedWhatsAppTabs.push(whatsAppTabs.splice(i, 1)[0]);
        }
    }
    if (removedWhatsAppTabs.length > 0)
    {
        chrome.tabs.remove(removedWhatsAppTabs);
    }
    return removedWhatsAppTabs.length;
}

// Handle data sent via chrome.runtime.sendMessage()

chrome.runtime.onMessage.addListener(onMessage);

function onMessage(messageEvent, sender, callback)
{
    if (messageEvent.name == "getIsBackgroundPage")
    {
        callback(sender.tab == undefined);
    }
    else if (messageEvent.name == "setToolbarIcon")
    {
        if (messageEvent.warn)
        {
            chrome.browserAction.setIcon({ path: { "19": "img/favicon19warn.png", "38": "img/favicon38warn.png" } });
        }
        else
        {
            chrome.browserAction.setIcon({ path: { "19": "img/favicon19.png", "38": "img/favicon38.png" } });
        }
        if (messageEvent.badgeText != undefined)
        {
            chrome.browserAction.setBadgeText({ text: messageEvent.badgeText });
        }
        if (messageEvent.tooltipText != undefined)
        {
            chrome.browserAction.setTitle({ title: messageEvent.tooltipText });
        }
    }
    else if (messageEvent.name == "backgroundNotificationClicked")
    {
        var url = whatsAppUrl + (typeof messageEvent.srcChat == "string" ? "#watSrcChat=" + messageEvent.srcChat : "");
        chrome.windows.getCurrent(function (window)
        {
            if (window != undefined && window.id != undefined)
            {
                if (debug) console.info("WAT: Create new WhatsApp tab in current window");
                
                chrome.tabs.create({ windowId: window.id, url: url }, function (tab)
                {
                    chrome.windows.update(tab.windowId, { focused: true });
                });
            }
            else if (chrome.runtime.lastError) // This check prevents the error log: "Unchecked runtime.lastError while running windows.getCurrent: No current window", see http://stackoverflow.com/a/25736436/423171
            {
                if (debug) console.info("WAT: Create new WhatsApp tab in new window");
                
                chrome.windows.create({ url: url, focused: true }, function (window)
                {
                    // After new window and new tab creation, remove all other WhatsApp tabs immediately so that they don't even load.
                    // This prevents the new tab to be removed automatically if another WhatsApp tab loads later.
                    chrome.tabs.query({ url: whatsAppUrl + "*", active: false }, function (tabs)
                    {
                        var tabsToRemove = [];
                        for (var i = 0; i < tabs.length; i++)
                        {
                            tabsToRemove.push(tabs[i].id);
                        }
                        if (tabsToRemove.length > 0)
                        {
                            chrome.tabs.remove(tabsToRemove);
                        }
                    });
                });
            }
        });
    }
    else if (messageEvent.name == "getOptions")
    {
        if (localStorage["watoolkitBackgroundNotif"] == "true" || localStorage["watoolkitBackgroundNotif"] == "false")
        {
            backgroundNotif = localStorage["watoolkitBackgroundNotif"] == "true";
        }
        else
        {
            localStorage["watoolkitBackgroundNotif"] = backgroundNotif;
        }
        if (localStorage["watoolkitWideText"] == "true" || localStorage["watoolkitWideText"] == "false")
        {
            wideText = localStorage["watoolkitWideText"] == "true";
        }
        else
        {
            localStorage["watoolkitWideText"] = wideText;
        }
        callback(
        {
            backgroundNotif: backgroundNotif,
            wideText: wideText
        });
    }
    else if (messageEvent.name == "setOptions")
    {
        if (messageEvent.backgroundNotif != undefined)
        {
            backgroundNotif = messageEvent.backgroundNotif == true;
            localStorage["watoolkitBackgroundNotif"] = backgroundNotif;
        }
        if (messageEvent.wideText != undefined)
        {
            wideText = messageEvent.wideText == true;
            localStorage["watoolkitWideText"] = wideText;
        }
    }
}
