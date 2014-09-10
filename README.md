libcal-opening-hours
====================

Javascript widget for LibCal Hours that shows Library opening hours in a injected widget.

Dependencies
------------
 * nodeJS
 * npm

Start a local testserver
------------------------

    npm install
    ./server [--verbose]

Browse to localhost:8001 (injected script and stylesheet will be fetched from localhost:8002 wich qualify for an xDomain operation).

Build development files
-----------------------

    gulp development [-dest=<YOURDESTINATION>]

_&lt;YOURDESTINATION&gt;_ : the URI to where you are going to dump the development files.

Copy the files from development/ to your desired webroot (_&lt;YOURDESTINATION&gt;_)

Build production files
----------------------

    gulp development [-dest=<YOURDESTINATION>]

*&lt;YOURDESTINATION&gt;* : the URI to where you are going to dump the production files.

Copy the files from production/ to your desired webroot (_&lt;YOURDESTINATION&gt;_)


The only difference between _development_ and _production_ files are that the production files are minified.
Index.html contains an example of how the widget should be initialized from other websites / CMS systems etc.

Please Note that **_both development and produvtion builds will hardcode a webroot into the files._** If that root needs to be anything but static.kb.dk, use the **_--dest_** option.
