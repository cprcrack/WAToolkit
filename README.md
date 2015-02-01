![WAToolkit](https://raw.githubusercontent.com/cprcrack/WAToolkit/master/resources/chrome_web_store_promo_1400x560.png)

## WAToolkit

Never ever miss a WhatsApp notification again while you are on your desktop computer! This extension makes it possible to receive WhatsApp notifications even when there is no WhatsApp tab or Chrome window at all open. This way you will never miss a message again while working on your PC.

### Features

★ **Enables always-on desktop notifications:** Chrome will run in background mode permanently, keeping track and showing your WhatsApp notifications instantly. You can click on the notifications to go directly to the relevant chat.

★ **Adds a convenient WhatsApp button to the toolbar:** It includes the number of unread messages always visible. You can hover the mouse over the icon and you will see a summary of your unread conversations in a tooltip. In addition, the icon will become orange if there's some kind of connectivity issue with your phone. You can still hide the button if you want, just right click on it and select *Hide button*.

★ **Ensures you only have one instance of WhatsApp Web open at any time:** That way you can focus on the right tab in any situation. Moreover, you won't be bothered with WhatsApp's exit confirmation messages any more.

★ **Extremely lightweight and fast:** Coded with performance in mind.

### Installation instructions

**The recommended installation path is directly from [Chrome Web Store](http://watoolkit.com)**, because you will benefit from a 2-click install and auto-updates. If for any reason you would like to install the last version of WAToolkit manually, you can follow these steps:

**Windows:**

1. Right click [here](https://raw.githubusercontent.com/cprcrack/WAToolkit/master/release/latest/sources.zip) and select *Save link as...* Save *sources.zip* temporarily to your desktop.
2. Unzip *sources.zip* to a permanent location of your choice, for example to *%UserProfile%\watoolkit\*
3. Click the Chrome menu icon ![Chrome menu](https://raw.githubusercontent.com/cprcrack/WAToolkit/master/resources/chrome_menu.png) on the browser toolbar and select *More tools > Extensions*.
4. Check the *Developer mode* checkbox in the top right of the Extensions page.
5. Click on *Load unpacked extensions...* and select the path where you saved the sources in step 2.

Sadly you will be annoyed with a warning message which you will have to *Cancel* every time you restart Chrome with developer mode activated.

**Mac OS X or Linux:**

1. Right click [here](https://raw.githubusercontent.com/cprcrack/WAToolkit/master/release/latest/watoolkit.crx) and select *Save link as...* Save *watoolkit.crx* temporarily to your desktop.
2. Click the Chrome menu icon ![Chrome menu](https://raw.githubusercontent.com/cprcrack/WAToolkit/master/resources/chrome_menu.png) on the browser toolbar and select *More tools > Extensions*.
3. Locate *watoolkit.crx* on your desktop and drag the file onto the Extensions page.
4. Review the requested [permissions](#permissions) in the dialog that appears and click *Install*.

### Frequent questions

**• How to install it?** Please follow the [installation instructions](#installation-instructions).

**• How to use it?** To start using WhatsApp Web, [install this extension](#installation-instructions) and click on the Chrome toolbar button with the *T* icon. If you are not logged in to WhatsApp, you must follow the instructions and scan the QR code with your phone. Remember to check the *Keep me signed in* checkbox so that your session is not closed automatically, or you may miss notifications.

**• I cannot see any notification, what's happening?** If the toolbar *T* icon is orange, there might be some connectivity issue with your phone. If you still cannot see WhatsApp notifications, please refer to the official support thread to solve the issue: http://www.whatsapp.com/faq/web/28080004

### Motivation

As all the software I make in my free time, I created WAToolkit because I wanted the functionality it offers for myself. My first need was being able to watch all WhatsApp notifications on my desktop computer, even without a WhatsApp tab opened (or any Chrome window at all), and that was its first feature. As the extension has raised some interest, I'll be maintaining WAToolkit and new features will probably be added in the future. Be sure to star this project on GitHub, [report bugs or suggest new ideas](https://github.com/cprcrack/WAToolkit/issues/new).

### Permissions

The message shown by Google Chrome for the requested permissions is far from the real needs of the extension, but the permissions are technically required for the following reasons:

**• Read and change your data on all whatsapp.com sites:** Required to create the background page that holds an active WhatsApp session.

**• Read your browsing history:** Required to detect whether an active WhatsApp session exists among the tabs you are browsing, avoiding conflicts with the background page.

### License and contributing

WAToolkit is free and open source. The source code is released under The GNU General Public License v3.0. Contributions are very welcome.

### Legal

WhatsApp is a trademark of WhatsApp Inc., registered in the U.S. and other countries. WAToolkit is an independent project developed by Cristian Perez and has no relationship to WhatsApp or WhatsApp Inc.
