libcal-opening-hours
====================

Javascript widget for LibCal Hours that shows Library opening hours.

Start a testserver
------------------
 * make development (will fetch the needed node modules for the webserver)
 * run ./server [--verbose]
 * Browse to localhost:8001 (injected script and stylesheet will be fetched from localhost:8002 wich qualify for an xDomain operation).

Build production files
----------------------
 * make production
 * Copy all files in production/ into your webspace, and serve those files for the net. index.html is an example of how the widget should be initialized from other websites / CMS systems etc.

Please Note that **_"make production" will hardcode a webroot into the files._** If that root is needed to be anything else than static.kb.dk, remember to change the builder/buildProduction.js argument home-dir to the desired webroot in the Makefile:

    node builder/buildProduction.js --homedir=YOUR_WEB_ROOT

