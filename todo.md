TODO
====
* ensure that everything is loaded as dynamic as possible, and that the loader script is as tidy and human readable as possible

Known bugs
==========
Chrome v28/Linux: Sometimes when the ModalDialog map is closed, the gray overlay kind of hangs, so it does not get to opacity 0 before it is stopped, resulting in a very lightgray background. It must be some rendering bug, because the overlay div is not there, and the lightgray background disappears as soon as the page is rerendered (like on collapsing and expanding the browser window).
When injecting the script into openCMS nothing shows up. (make sure that nothing tries to render if no data is recieved ... I think it is like that by now, but check it!)

I have tried out jsonPath to traverse the json blob from libCal, since I thought it would be easier to maintain if libCal changes the structure of the blob. It probably would be too (depending on the changes), but the path syntax was not in any way easily read, and I did a performancetest that showed my vanillaJS code to be 3 times as fast as jsonPath, so I have dropped to use it! Performance test can be seen here: http://jsperf.com/jsonpath-vs-vanillajs

