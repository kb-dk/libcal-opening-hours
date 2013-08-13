/*global window, console, $, google*/

// polyfill forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, context) {
        context = context || window;
        for (var i = 0; i < this.length; i += 1) {
            fn.call(context, this[i], i, this);
        }
    }; 
}

function loadAdditionalJavascript(url, callback) { // TODO: We might wanna shovel this into window.OpeningHours to avoid cluttering windows?
    var script = document.createElement('script');
    script.async = true;
    script.src = url;
    var entry = document.getElementsByTagName('script')[0];
    entry.parentNode.insertBefore(script, entry);
    script.onload = script.onreadystatechange = function () {
        var rdyState = script.readyState;
        if (!rdyState || /complete|loaded/.test(rdyState)) {
            if (callback) {
                callback();
            }
            // avoid IE memoryleak http://mng.bz/W8fx
            script.onload = null;
            script.readyState = null;
        }
    };
}

var OpeningHours = (function (document) {
    'use strict';
    //import stylesheet // TODO: Make sure loading this sheet does not block for anything else
    var newCssLinkElement = document.createElement('link');
    newCssLinkElement.rel = 'stylesheet';
    newCssLinkElement.href = 'http://localhost:8002/openingHoursStyles.css';
    document.getElementsByTagName('head')[0].appendChild(newCssLinkElement);

    if (typeof $ === 'function' && $('#openingHoursModalDiv') && $('#openingHoursModalDiv').modal) {
        // bootstrap and jQuery (in some form) is present
    } else {
        // no bootstrap / jQuery
        var modalDiv = document.getElementById('openingHoursModalDiv');
        modalDiv.style.opacity = 0;
        modalDiv.style.top = '-25%';
    }

// ===== [ private helper functions ] =====
    var ugedage = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
        weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        weekdayToUgedagHash = [],
        nextRowIsOdd = true, // used to keep track of odd/even rows - not that sexy, but it works for now
        libraryIndex = []; // index in locations for the different libraries

    ugedage.forEach(function (ugedag, index) {
        weekdayToUgedagHash[weekdays[index]] = ugedag;
    });

    /**
     * Transforms a Date.getDay() number into an english dayname
     * @param dayIndex Optional If not specified today will be used
     */
    function getDayName(dayIndex) {
        return weekdays[dayIndex || new Date().getDay()];
    }

    /**
     * Creates a table row - all but the very first row is set to class="timeField" (=centered no-wrap)
     */
    function getTr() {
        var str = '<tr class="' + (nextRowIsOdd? 'odd' : 'even') + '">';
        nextRowIsOdd = !nextRowIsOdd;
        for (var i = 0; i < arguments.length; i += 1) {
            if ((typeof arguments[i] === 'string') || (arguments[i] instanceof String)) {
                str += '<td' + (i > 0 ? ' class="timeField"' : '') + '>' + arguments[i] + '</td>';
            } else { // TODO: If needed, this could be done more elegantly, shoveling all sorts of attributes in the html element.
                if ((typeof arguments[i] === 'object') && (arguments[i] !== null)) {
                    str += '<td>';
                    str += arguments[i].href ? '<a href="' + arguments[i].href + '">' : '';
                    str += arguments[i].text ? arguments[i].text : '';
                    str += arguments[i].href ? '</a>' : '';
                } else {
                    str += '<td></td>';
                }
            }
        }
        return str + '</tr>';
    }

// ===== [ NotInitializedError ] =====
    function NotInitializedError(msg) {
        this.name = "NotInitializedError";
        this.message = msg || 'Object not initialized';
    }
    NotInitializedError.prototype = Error.prototype;

// ===== [ OpeningHours Object ] =====
    var OpeningHours = function (data) {
        this.openingHours = data;
        // generating google.maps.LatLng positions for all libraries with lat:long attributes
        this.openingHours.locations.forEach(function (location) {
            if (location.lat.length && location.long.length) {
                location.latLng = new google.maps.LatLng(location.lat, location.long);
            }
        });
        this.targetElement = document.getElementById('openingHoursTargetDiv');
        this.modalDialog = document.getElementById('openingHoursModalDiv');
        this.viewCache = {};
    };

    OpeningHours.prototype = {
        constructor : OpeningHours,
        
        init : function (config) {
            if (!this.openingHours) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            this.config = config || {
                library: 'all',
                timespan: 'day',
                colorScheme: 'standard'
            };
            for (var i=0; i < this.openingHours.locations.length; i += 1) {
                libraryIndex[this.openingHours.locations[i].name] = i;
            }
            //inject modal dialog DOM
            this.modalDialog.innerHTML = '<div class="modal-header"><button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button><h3 id="openingHoursModalLabel">OpeningHours</h3></div><div class="modal-body"></div>';
            this.modalBody = this.modalDialog.lastChild;
            // initialize the view requested in the snippet
            this.setView({
                library : this.config.library,
                timespan : this.config.timespan
            });
        },

        /**
         * Sets display:none on all generated views, effectively turning them off
         */
        turnOffAllViews : function () {
            if (!this.targetElement) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this;
            Array.prototype.forEach.call(that.targetElement.childNodes, function (view) {
                view.style.display = 'none';
            });
        },

        turnOffAllModals : function () {
            if (!this.targetElement) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this;
            Array.prototype.forEach.call(that.modalBody.childNodes, function (dialog) {
                dialog.style.display = 'none';
            });
        },

        showModal : function () {
            var that = this,
                modalDiv = (typeof $ === 'function') && $('#openingHoursModalDiv') || document.getElementById('openingHoursModalDiv');
            if (modalDiv && modalDiv.modal) {
                modalDiv.modal('show');
            } else {
                console.log('no jQuery and/or bootstrap in here ... gotta do it by hand!');
                modalDiv = modalDiv instanceof HTMLElement ? modalDiv : modalDiv[0];
                modalDiv.style.display = 'block';
                modalDiv.style.opacity = 1;
                modalDiv.style.top = '10%';
                if (!that.overlay) { // NOTE: This is the first time the modal is set up by hand
                    that.overlay = document.createElement('div');
                    that.overlay.className = 'openingHoursOverlay';
                    modalDiv.getElementsByClassName('close')[0].addEventListener('click', function () { // also attach an eventhandler for the close button
                        that.hideModal.call(that);
                    });
                    document.body.appendChild(this.overlay);
                } 
                that.overlay.style.display = 'block';
            }
        },

        hideModal : function () {
            var that = this,
                modalDiv = (typeof $ === 'function') && $('#openingHoursModalDiv') || document.getElementById('openingHoursModalDiv');
            if (modalDiv && modalDiv.modal) {
                modalDiv.modal('hide');
            } else {
                console.log('no jQuery and/or bootstrap in here ... gotta do it by hand!');
                modalDiv = modalDiv instanceof HTMLElement ? modalDiv : modalDiv[0];
                modalDiv.style.opacity = 0;
                modalDiv.style.top = '-25%';
                window.setTimeout(function () { modalDiv.style.display = 'none'; }, 300);
                that.overlay.style.display = 'none';
            }
        },

        /**
         * Set view to a desired view. Any other views will be turned off but cached for later use.
         * If a view isn't rendered yet, this method initiates a render of the chosen view.
         * @param config {Object} Config object containing zero, one or two of the following parameters:
         *  - library {String} Optional A string representation of the library that is requested. Needs to be the same as defined in libCal.Hours, or 'all' for all libraries.
         *  - timespan {String} Optional The timespan to view. Either 'day', 'week' or 'map'. (map shows a modal dialog with the map)
         * if one (or more) of the parameters is not set, it will fall back on the current state of that parameter (set in this.config)
         * if nothing is set, it will fall back on 'all', 'day'
         */
        setView : function (config) {
            if (!this.viewCache) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            config = config || {};
            config.library = config.library || this.config.library || 'all';
            config.timespan = config.timespan || this.config.timespan || 'day';
            var that = this,
                viewId = ((config.timespan !== 'map') ? // we only want one google.map view in the cache (and just pans it around and sets/removes markers as we go along)!
                    config.library + ':' + config.timespan :
                    'map');

            if (viewId === 'map' || viewId === 'all:week') {
                // This is a modal dialog
                if (that.viewCache[viewId]) {
                    // We do have this one rendered in the viewCache already
                    that.turnOffAllModals();
                    that.viewCache[viewId].style.display = 'block';
                    if (viewId === 'map'){
                        // prepare the map
                        var lib = this.getLibrary(config.library),
                            position = new google.maps.LatLng(lib.lat, lib.long);
                        that.gmap.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                        that.gmap.setZoom(15);
                        that.gmap.setCenter(position); // FIXME: On the very first rendering this is centering in 0,0 on the map??
                        that.gmapMarker.setPosition(position);
                        that.gmapMarker.setAnimation(google.maps.Animation.DROP);
                    }
                    that.showModal();
                } else {
                    // view has to be rendered
                    try{
                        that.renderView(
                            config.library,
                            config.timespan,
                            function (){
                                that.setView(config);
                            }
                        );
                    } catch (e) {
                        if (e instanceof ReferenceError) {
                            console.warn(e.message);
                        } else {
                            throw e;
                        }
                    }
                }
            } else {
                // This is a plain view
                if (that.viewCache[viewId]) {
                    // We do have this one rendered in the viewCache already
                    that.config.library = config.library;
                    that.config.timespan = config.timespan;
                    that.turnOffAllViews();
                    that.viewCache[viewId].style.display = 'block';
                } else {
                    try{
                        that.renderView(
                            config.library, 
                            config.timespan,
                            function () {
                                that.setView(config);
                            }
                        );
                    } catch (e) {
                        if (e instanceof ReferenceError) {
                            console.warn(e.message);
                        } else {
                            throw e;
                        }
                    }
                }
            }
        },

        renderView : function (library, timespan, cb) {
            if (!this.openingHours) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this,
                innerHTML,
                newDiv;
            if (timespan === 'map') {
                var lib = that.getLibrary(library);
                newDiv = document.createElement('div');
                newDiv.style.height = '300px'; // FIXME: this should be calculated depending on the client, not just hardcoded to something!
                var mapOptions =  {
                        center: new google.maps.LatLng(lib.lat, lib.long),
                        zoom: 8,
                        streetViewControl: false,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    },
                    map = new google.maps.Map(newDiv, mapOptions);
                that.gmap = map;
                that.gmapMarker = new google.maps.Marker({
                    position : new google.maps.LatLng(lib.lat, lib.long),
                    animation : google.maps.Animation.DROP,
                    map : that.gmap
                });
                that.modalBody.appendChild(newDiv);
                // every time the modal is shown, the map should resize
                $(that.modalDialog).one('shown', function () { // FIXME: All this have to work without jQuery and bootstrap too! :-S
                    if (that.gmap) {
                        google.maps.event.trigger(that.gmap, 'resize');
                    }
                });
                that.viewCache['map'] = newDiv;
                if (cb) {
                    cb();
                }
            } else {
                innerHTML = that.assembleView(library, timespan);
                newDiv = document.createElement('div');
                newDiv.className = 'openingHoursView';
                newDiv.innerHTML = innerHTML;
                newDiv.style.display = 'none';
                if (library === 'all' && timespan === 'week') {
                    that.modalBody.appendChild(newDiv);
                } else {
                    that.targetElement.appendChild(newDiv);
                }
                that.viewCache[library + ':' + timespan] = newDiv;
                if (cb) {
                    cb(); // NOTE: rendering all:week recalls setView after rendering in a callback 
                }
            }
        },

/*jshint scripturl:true*/
        /**
         * Assemble an innerHTML string for a specific view.
         * @param library {String} A string representation of the library that is requested. Needs to be the same as defined in libCal.Hours, or 'all' for all libraries.
         * @param timespan {String} The timespan to view. Either 'day' or 'week'.
         * @return String an innerHTML string that contains the requested table.
         */
        assembleView : function (library, timespan) {
            if (!this.openingHours) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this,
                contentStr,
                today;
            // build the view for library_timespan
            contentStr = '';
            nextRowIsOdd = true;
            if (!(timespan==='week' || timespan === 'day' || timespan === 'map')) {
                throw new ReferenceError('Requested timespan "' + timespan + '" is illegal. Try "day" or "week".', 'openingHours');
            }
            if (library === 'all') {
                if (timespan === 'week') {
                    // --- [ all week ] ---
                    contentStr += '<table>' + that.getThead(
                        that.config.i18n.library,
                        that.config.i18n.weekdaysAbbr[0], // this looks like something that ought to be an array instead?
                        that.config.i18n.weekdaysAbbr[1],
                        that.config.i18n.weekdaysAbbr[2],
                        that.config.i18n.weekdaysAbbr[3],
                        that.config.i18n.weekdaysAbbr[4],
                        that.config.i18n.weekdaysAbbr[5],
                        that.config.i18n.weekdaysAbbr[6]
                        ) + '<tbody>';
                    that.openingHours.locations.forEach(function (location) {
                        contentStr += getTr(
                            location.name,
                            that.timesToStr(location.weeks[0].Monday.times),
                            that.timesToStr(location.weeks[0].Tuesday.times),
                            that.timesToStr(location.weeks[0].Wednesday.times),
                            that.timesToStr(location.weeks[0].Thursday.times),
                            that.timesToStr(location.weeks[0].Friday.times),
                            that.timesToStr(location.weeks[0].Saturday.times),
                            that.timesToStr(location.weeks[0].Sunday.times)
                        );
                    });
                    contentStr += '</tbody></table>';
                } else {
                    // --- [ all day ] ---
                    contentStr += '<table>' + that.getThead(that.config.i18n.library, that.config.i18n.openHourToday) + '<tbody>';
                    today = getDayName(); // TODO: We could check for dates too, to invalidate these?
                    that.openingHours.locations.forEach(function (location) {
                        contentStr += getTr(
                            {
                                href: 'javascript: openingHours.setView({library: \'' + location.name + '\',timespan: \'week\' });',
                                text: location.name
                            },
                            that.timesToStr(location.weeks[0][today].times)
                        );
                    });
                    contentStr += '</tbody>';
                    contentStr += that.getTfoot(
                        {
                            text : that.config.i18n.allWeek,
                            href : 'javascript: openingHours.setView({timespan:\'week\'});'
                        }
                    );
                }
            } else {
                var libraryObj, libraryHours;
                try {
                    libraryObj = that.getLibrary(library);
                    libraryHours = that.getLibraryHours(libraryObj);
                } catch (e) {
                    if (e instanceof ReferenceError) {
                        throw e;
                    }
                }
                switch (timespan) {
                case 'day' :
                    // --- [ lib day ] ---
                    contentStr += '<table>' + that.getThead(that.config.i18n.library, that.config.i18n.openHourToday) + '<tbody>';
                    today = getDayName();
                    contentStr += getTr(library, that.timesToStr(libraryHours[today].times));
                    contentStr += '</tbody>';
                    contentStr += that.getTfoot(
                        {
                            text : that.config.i18n.allWeek,
                            href : 'javascript:openingHours.setView({timespan:\'week\'});'
                        }, (libraryObj.long ? {
                            text : that.config.i18n.map,
                            href : 'javascript:openingHours.setView({timespan:\'map\'});'
                        } : undefined)
                    );
                    break;
                case 'week' :
                    // --- [ lib week ] ---
                    contentStr += '<table>' + that.getThead(library, that.config.i18n.openHour) + '<tbody>';
                    that.config.i18n.weekdays.forEach(function (weekday, index) {
                        contentStr += getTr(weekday, that.timesToStr(libraryHours[weekdays[(index + 1) % 7]].times));
                    });
                    contentStr += '</tbody>';
                    contentStr += that.getTfoot(
                        {
                            text : that.config.i18n.allLibraries,
                            href : 'javascript:openingHours.setView({library:\'all\', timespan: \'day\'});'
                        }, (libraryObj.long ? {
                            text : that.config.i18n.map,
                            href : 'javascript:openingHours.setView({timespan:\'map\'});'
                        } : undefined)
                    );
                    break;
                }
            } 
            return contentStr;
        },
/*jshint scripturl:false*/

        // --- helper functions
        getLibrary : function (library) {
            var that = this;
            for (var i = 0; i < that.openingHours.locations.length; i += 1) {
                if (that.openingHours.locations[i].name === library) {
                    return that.openingHours.locations[i];
                }
            }
            throw new ReferenceError('Requested library "' + library + '" does not exist in libCal.', 'openingHours');
        },

        /**
         * Get library hours split up in weekdays for a single library.
         * @param library {string|Object} If string, the opening hours of the library with that name is returned. If Object, that librarys openingHours is returned.
         * @return {Object} Object with all opening hours for each weekday
         */
        getLibraryHours : function (library) {
            if ((typeof library === 'string') || (library instanceof String)) {
                library = this.getLibrary(library);
            }
            return library.weeks[0];
        },

        ampmTo24 : function (str) { // FIXME: I don't think this need to be a member variable?
            if (str.indexOf('am') >= 0) {
                return parseInt(str, 10).toString();
            }
            if (str.indexOf('pm') >= 0) {
                return (parseInt(str, 10) + 12).toString();
            }
            return str;
        },

        timesToStr : function (times) {
            if (times.status !== 'open') {
                return this.config.i18n.closed;
            }
            var str = '';
            for (var i = 0; i < times.hours.length; i += 1) {
                if (this.config.i18n.ampm) {
                    str += times.hours[i].from + ' - ' + times.hours[i].to;
                } else {
                    str += this.ampmTo24(times.hours[i].from) + ' - ' + this.ampmTo24(times.hours[i].to);
                }
                if (i !== times.hours.length - 1) {
                    str += ', ';
                }
            }
            return str;
        },

        /**
         * Returns a html string where all arguments are wrapped in.
         * Format: '<thead><tr><th>arg1</th><th>arg2</th>...</tr></thead>'
         * Also adds class first and last to the first and last header
         */
        getThead : function () {
            var str = '<thead><tr class="' + (this.config.colorScheme || 'standard') + '">';
            if (arguments.length < 2) {
                return str + '<th class="first last">' + (arguments[0] || '') + '</th></tr></thead>';
            } else {
                str += '<th class="first">' + arguments[0] + '</th>';
                for (var i = 1; i < arguments.length - 1; i += 1) {
                    str += '<th>' + arguments[i] + '</th>';
                }
                return str + '<th class="last">' + arguments[arguments.length-1] + '</th></tr></thead>';
            }
        },

        /**
         * Returns a html string with one or two links in the bottom of the table.
         * Format: '<tfoot><tr><td colspan="2"><div class="floatright"><a href="arg1.href">arg1.text</a></div>[<div class="floatleft"><a href="arg2.href">arg2.text</a></div>]</td></tr></tfoot>'
         * Also adds class first and last to the first and last header
         */
        getTfoot : function (rightLink, leftLink) {
            var str = '<tfoot><tr class="' + (nextRowIsOdd ? 'odd' : 'even') + '"><td colspan="2">';
            str += '<div class="floatright"><a href="' + rightLink.href + '">' + rightLink.text + '</a></div>';
            if (leftLink) {
                str += '<div class="floatleft"><a href="' + leftLink.href + '">' + leftLink.text + '</a></div>';
            }
            return str + '</td></tr></tfoot>';
        },

    };

    // this is needed for google.maps to be loaded correctly asyncronuosly (but it is pretty hideous to clutter the global object up like this?)
    OpeningHours.initializeGMaps = function () {};

    OpeningHours.loadOpeningHours = function (data) {
        window.openingHours = new OpeningHours(data);
        window.openingHours.init(OpeningHours.config);
    };

    return OpeningHours;
})(window.document);

// load google.maps if they are not present
if (!window.google || !window.google.maps) {
    loadAdditionalJavascript('//maps.googleapis.com/maps/api/js?sensor=false&callback=OpeningHours.initializeGMaps');
}
