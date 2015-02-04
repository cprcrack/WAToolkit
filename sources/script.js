/*
WAToolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var debug = true;
var debugRepeating = false;

var whatsAppUrl = "https://web.whatsapp.com/";

var safetyDelayShort = 250;
var safetyDelayLong = 1000;

var checkBadgeInterval = 5000;
var checkLoadingErrorInterval = 30000;

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
    onMainUiReady(function ()
    {
        proxyNotifications(true);
        checkBadge(false);
        reCheckBadge();
    });

    reCheckLoadingError();
}

function foregroundScript()
{
    onMainUiReady(function ()
    {
        proxyNotifications(false);
        checkBadge(false);
        reCheckBadge();

        checkSrcChat();
        addOptions();
    });
}

// FOR BOTH BACKGROUND AND FOREGROUND SCRIPTS ////////////////////////////////////////////////////

function onMainUiReady(callback)
{
    if (debug) console.info("WAT: Setting up mutation observer for main UI ready event...");

    try
    {
        var appWrapperElem = document.getElementsByClassName("app-wrapper")[0];
        if (appWrapperElem != undefined)
        {
            var mutationObserver = new MutationObserver(function (mutations)
            {
	            if (debug) console.info("WAT: Mutation observerd, will search main UI");
            
                // Search for new child div with class "app"
                var found = false;
                for (var i = 0; i < mutations.length; i++)
                {
                    var mutation = mutations[i];
                    var addedNodes = mutations[i].addedNodes;
                    for (var j = 0; j < addedNodes.length; j++)
                    {
                        var addedNode = addedNodes[j];
                        if (addedNode.nodeName.toLowerCase() == "div")
                        {
                            var addedNodeClass = addedNode.getAttribute("class");
                            if (typeof addedNodeClass == "string" && addedNodeClass.indexOf("app") > -1)
                            {
                                if (debug) console.info("WAT: Found main UI, will notify main UI ready event");

                                mutationObserver.disconnect();
                                setTimeout(function () { callback(); }, safetyDelayShort);
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found)
                    {
                        break;
                    }
                }
            });
            mutationObserver.observe(appWrapperElem, { childList: true });
        }
    }
    catch (err)
    {
        console.error("WAT: Exception while setting up mutation observer for main UI ready event");
        console.error(err);
    }
}

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
                setTimeout(function () { checkBadge(false); }, safetyDelayLong);
            }
        });
    }

    var script = "";
    script += "var debug = " + debug + ";";
    script += "var isBackgroundScript = " + isBackgroundScript + ";";
    script += "(" + function ()
	{
        // Notification spec: https://developer.mozilla.org/en/docs/Web/API/notification

        // Save native notification
        var _Notification = window.Notification;

        // Create proxy notification
        var ProxyNotification = function (title, options)
        {
            if (debug) console.info("WAT: Notification creation intercepted");

            // Proxy constructor
            var _notification = new _Notification(title, options);

            // Proxy instance properties
            this.title = _notification.title;
            this.dir = _notification.dir;
            this.lang = _notification.lang;
            this.body = _notification.body;
            this.tag = _notification.tag;
            this.icon = _notification.icon;

            // Proxy event handlers
            var that = this;
            _notification.onclick = function (event)
            {
                if (that.onclick != undefined) that.onclick(event);

                if (isBackgroundScript)
                {
                    var srcChat = undefined;
                    if (event != undefined && event.srcElement != undefined && typeof event.srcElement.tag == "string")
                    {
                        if (debug) console.info("WAT: Background notification click intercepted with srcChat " + event.srcElement.tag);

                        srcChat = event.srcElement.tag;
                    };
                    window.postMessage({ name: "backgroundNotificationClicked", srcChat: srcChat }, "*");
                }
                else
                {
                    if (debug) console.info("WAT: Foreground notification click intercepted");
                    
                    window.postMessage({ name: "foregroundNotificationClicked" }, "*");
                };
            };
            _notification.onshow = function (event)
            {
                if (that.onshow != undefined) that.onshow(event);

                if (!isBackgroundScript)
                {
                    if (debug) console.info("WAT: Foreground notification show intercepted");
                    
                    window.postMessage({ name: "foregroundNotificationShown" }, "*");
                };
            };
            _notification.onerror = function (event)
            {
                if (that.onerror != undefined) that.onerror(event);
            };
            _notification.onclose = function (event)
            {
                if (that.onclose != undefined) that.onclose(event);
            };

            // Proxy instance methods
            this.close = function ()
            {
                _notification.close();
            };
            this.addEventListener = function (type, listener, useCapture)
            {
                _notification.addEventListener(type, listener, useCapture);
            };
            this.removeEventListener = function (type, listener, useCapture)
            {
                _notification.removeEventListener(type, listener, useCapture);
            };
            this.dispatchEvent = function (event)
            {
                _notification.dispatchEvent(event);
            };
        };

        // Proxy static properties
        ProxyNotification.permission = _Notification.permission;

        // Proxy static methods
        ProxyNotification.requestPermission = _Notification.requestPermission;

        // Replace native notification with proxy notification
        window.Notification = ProxyNotification;
    } + ")();";

    var scriptElem = document.createElement("script");
    scriptElem.innerHTML = script;
    document.head.appendChild(scriptElem);
}

var lastToolbarIconWarn = -1;
var lastToolbarIconBadgeText = -1;
var lastToolbarIconTooltipText = -1;

function reCheckBadge()
{
    setTimeout(function () { checkBadge(true); }, checkBadgeInterval);
}

function checkBadge(reCheck)
{
    if (debugRepeating) console.info("WAT: Checking badge...");
    
    try
    {
        var isSessionActive = document.getElementsByClassName("pane-list-user").length > 0;
        var warn = !isSessionActive || document.getElementsByClassName("butterbar-phone").length > 0 || document.getElementsByClassName("butterbar-computer").length > 0;

        if (isSessionActive)
        {
            var totalUnreadCount = 0;
            var tooltipText = "";

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
                tooltipText += (i > 0 ? "\n" : "") + "(" + unreadCount + ")  " + chatTitle + "  →  " + chatStatus + "  [" + chatTime + "]";
            }

            var badgeText = "";
            if (totalUnreadCount > 0)
            {
                badgeText = totalUnreadCount.toString();
            }
            if (tooltipText.length == 0)
            {
                tooltipText = "Open WhatsApp"; // Should match browser_action.default_title defined in manifest.json
            }
            if (lastToolbarIconWarn !== warn || lastToolbarIconBadgeText !== badgeText || lastToolbarIconTooltipText !== tooltipText)
            {
                if (debug) console.info("WAT: Will update toolbar icon info");
                
                chrome.runtime.sendMessage({ name: "setToolbarIcon", warn: warn, badgeText: badgeText, tooltipText: tooltipText });
                lastToolbarIconWarn = warn;
                lastToolbarIconBadgeText = badgeText;
                lastToolbarIconTooltipText = tooltipText;
            }
            else
            {
                if (debugRepeating) console.info("WAT: Will not update toolbar icon info because it did not change");
            }
        }
        else
        {
            if (lastToolbarIconWarn !== warn)
            {
                if (debug) console.info("WAT: Will update toolbar icon warning info");

                chrome.runtime.sendMessage({ name: "setToolbarIcon", warn: warn });
                lastToolbarIconWarn = warn;
            }
            else
            {
                if (debugRepeating) console.info("WAT: Will not update toolbar icon warning info because it did not change");
            }
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

// FOR BACKGROUND SCRIPT /////////////////////////////////////////////////////////////////////////

var lastPotentialLoadingError = false;

function reCheckLoadingError()
{
    setTimeout(function () { checkLoadingError(); }, checkLoadingErrorInterval);
}

function checkLoadingError()
{
    if (debug) console.info("WAT: Checking potential loading error...");

    try
    {
        var potentialLoadingError = document.getElementsByClassName("spinner").length > 0;

        if (potentialLoadingError && !lastPotentialLoadingError)
        {
            if (debug) console.warn("WAT: Found potential loading error");
        }

        if (lastPotentialLoadingError && potentialLoadingError)
        {
            if (debug) console.warn("WAT: Found loading error, will reload");
            
            window.location.href = whatsAppUrl;
        }
        else
        {
            lastPotentialLoadingError = potentialLoadingError;
        }
    }
    catch (err)
    {
        console.error("WAT: Exception while checking loading error");
        console.error(err);
    }

    reCheckLoadingError();
}

// FOR FOREGROUND SCRIPT /////////////////////////////////////////////////////////////////////////

function checkSrcChat()
{
    if (debug) console.info("WAT: Checking source chat...");
    
    try
    {
        var paramPrefix = "#watSrcChat=";
        var srcChat = window.location.hash;
        if (typeof srcChat == "string" && srcChat.indexOf(paramPrefix) == 0)
        {
            srcChat = srcChat.substr(paramPrefix.length).replace(/\./g, "-");
            var chats = document.getElementsByClassName("chat");
            for (var i = 0; i < chats.length; i++)
            {
                var chat = chats[i];
                var dataReactId = chat.getAttribute("data-reactid")
                if ((typeof dataReactId == "string") && dataReactId.indexOf(srcChat) > -1)
                {
                    if (debug) console.info("WAT: Found source chat, will click it");

                    history.replaceState({}, document.title, "/");
                    setTimeout(function () { chat.click(); }, safetyDelayShort); // The delay fixes some strange page misposition glitch
                    break;
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

function addOptions()
{
    if (debug) console.info("WAT: Adding options...");

    try
    {
        var firstMenuItem = document.getElementsByClassName("menu-item")[0];
        if (firstMenuItem != undefined)
        {
            if (debug) console.info("WAT: Will add options");

            var menuItemElem = document.createElement("div");
            menuItemElem.setAttribute("class", "menu-item menu-item-watoolkit");
            var iconElem = document.createElement("button");
            iconElem.setAttribute("class", "icon icon-watoolkit");
            iconElem.setAttribute("title", "WAToolkit options");
            iconElem.innerHTML = "WAToolkit options";
            menuItemElem.appendChild(iconElem);

            iconElem.addEventListener("click", function ()
            {
                if (menuItemElem.getAttribute("class").indexOf("active") > -1)
                {
                    menuItemElem.setAttribute("class", "menu-item menu-item-watoolkit");
                }
                else
                {
                    menuItemElem.setAttribute("class", "menu-item active menu-item-watoolkit");
                }
            });
            firstMenuItem.parentElement.insertBefore(menuItemElem, firstMenuItem);
        }
    }
    catch (err)
    {
        console.error("WAT: Exception while adding options");
        console.error(err);
    }
}
