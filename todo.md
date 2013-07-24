TODO
====
* adapt to bootstrap structure (and make the css so it will work without too)
* wire up links to navigate between views
* make overlay for map and view all:week
* ensure that everything is loaded as dynamic as possible, and that the loader script is as tidy and human readable as possible

I have tried out jsonPath to traverse the json blob from libCal, since I thought it would be easier to maintain if libCal changes the structure of the blob. It probably would be too (depending on the changes), but the path syntax was not in any way easily read, and I did a performancetest that showed my vanillaJS code to be 3 times as fast as jsonPath, so I have dropped to use it! Performance test can be seen here: http://jsperf.com/jsonpath-vs-vanillajs

