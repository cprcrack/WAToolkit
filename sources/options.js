/*
WAToolkit
Author: Cristian Perez <http://www.cpr.name>
License: GNU GPLv3
*/


var whatsAppUrl = "https://web.whatsapp.com/";

var counter = 10;
var counterElem = document.getElementById("counter");

setInterval(function()
{
    counter--;
    counterElem.innerHTML = counter;

    if (counter < 1)
    {
        setTimeout(function ()
        { 
            window.location.href = whatsAppUrl;
            window.close();
        }, 100);
    }
}, 1000); 
