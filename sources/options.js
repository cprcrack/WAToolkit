/*
WAToolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var whatsAppUrl = "https://web.whatsapp.com/";
var optionsFragment = "#WAToolkitOptions";

// window.outerWidth returns 0 when opened on the extensions page
// When the system tray menu entry is clicked, options.html is opened in
// a regular tab and therefore has a width >= 1
if (typeof window.outerWidth == "number" && window.outerWidth == 0)
{
    window.location.href = whatsAppUrl + optionsFragment;
}
else
{
    window.location.href = whatsAppUrl;
}
