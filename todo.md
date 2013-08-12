TODO
====
* adapt to bootstrap structure (and make the css so it will work without too)
* remove use of jQuery and bootstrap if they are not present
* ensure that everything is loaded as dynamic as possible, and that the loader script is as tidy and human readable as possible
* the modals only stacks the cached views under modal-body, but they should be containing the modal-header as well
* the modal map view should contain some data about the library too, like library.description, library.contact and library.url (footnote and name in the modal head?)
* the table headers should use the librarys color (or at least a config option should force them to be used?)

Known bugs
==========
* On the very first render of a map, the setCenter is setting center in the maps top left corner. (only happens the very first time)

I have tried out jsonPath to traverse the json blob from libCal, since I thought it would be easier to maintain if libCal changes the structure of the blob. It probably would be too (depending on the changes), but the path syntax was not in any way easily read, and I did a performancetest that showed my vanillaJS code to be 3 times as fast as jsonPath, so I have dropped to use it! Performance test can be seen here: http://jsperf.com/jsonpath-vs-vanillajs

