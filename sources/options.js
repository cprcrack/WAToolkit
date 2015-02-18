/*
WAToolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var whatsAppUrl = "https://web.whatsapp.com/";
var optionsFragment = "#watOptions";

if (typeof window.outerWidth == "number" && window.outerWidth == 0)
{
    // Options were opened via chrome://extensions
    window.location.href = whatsAppUrl + optionsFragment;
}
else
{
    // Options were opened via system tray
    window.location.href = whatsAppUrl;
}
