/*global window, console*/

// polyfill forEach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fn, context) {
        context = context || window;
        for (var i = 0; i < this.length; i += 1) {
           fn.call(context, this[i], i, this);
        }
    } 
}

var OpeningHours = (function (document) {
    'use strict';
    //import stylesheet // TODO: Make sure loading this sheet does not block for anything else
    var newCssLinkElement = document.createElement('link');
    newCssLinkElement.rel = 'stylesheet';
    newCssLinkElement.href = 'http://localhost:8002/openingHoursStyles.css';
    document.getElementsByTagName('head')[0].appendChild(newCssLinkElement);

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
            str += '<td' + (i > 0 ? ' class="timeField"' : '') + '>' + arguments[i] + '</td>';
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
        this.targetElement = document.getElementById('openingHoursTargetDiv');
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

        /**
         * Set view to a desired view. Any other views will be turned off but cached for later use.
         * If a view isn't rendered yet, this method initiates a render of the chosen view.
         * @param config {Object} Config object containing zero, one or two of the following parameters:
         *  - library {String} Optional A string representation of the library that is requested. Needs to be the same as defined in libCal.Hours, or 'all' for all libraries.
         *  - timespan {String} Optional The timespan to view. Either 'day' or 'week'.
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
                viewId = config.library + ':' + config.timespan;
            if (that.viewCache[viewId]) {
                that.turnOffAllViews();
                that.viewCache[viewId].style.display = 'block';
            } else {
                try{
                    that.renderView(config.library, config.timespan);
                    that.setView({
                        library : config.library,
                        timespan : config.timespan
                    });
                    that.config.library = config.library;
                    that.config.timespan = config.timespan;
                } catch (e) {
                    if (e instanceof ReferenceError) {
                        console.warn(e.message);
                    } else {
                        throw e;
                    }
                }
            }
        },

        renderView : function (library, timespan) {
            if (!this.openingHours) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this,
                innerHTML = that.assembleView(library, timespan),
                newDiv = document.createElement('div');
            newDiv.className = 'openingHoursView';
            newDiv.innerHTML = innerHTML;
            newDiv.style.display = 'none';
            that.targetElement.appendChild(newDiv);
            that.viewCache[library + ':' + timespan] = newDiv;
        },

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
            if (!(timespan==='week' || timespan === 'day')) {
                throw new ReferenceError('Requested timespan "' + timespan + '" is illegal. Try "day" or "week".', 'openingHours');
            }
            if (library === 'all') {
                if (timespan === 'week') {
                    // --- [ all week ] ---
                    contentStr += '<table>' + that.getThead(
                        this.config.i18n.library,
                        this.config.i18n.weekdaysAbbr[0], // this looks like something that ought to be an array instead?
                        this.config.i18n.weekdaysAbbr[1],
                        this.config.i18n.weekdaysAbbr[2],
                        this.config.i18n.weekdaysAbbr[3],
                        this.config.i18n.weekdaysAbbr[4],
                        this.config.i18n.weekdaysAbbr[5],
                        this.config.i18n.weekdaysAbbr[6]
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
                    contentStr += '</tbody></table>'; // TODO: link in tfoot to be inserted here!
                } else {
                    // --- [ all day ] ---
                    contentStr += '<table>' + that.getThead(this.config.i18n.library, this.config.i18n.openHourToday) + '<tbody>';
                    today = getDayName(); // TODO: We could check for dates too, to invalidate these?
                    that.openingHours.locations.forEach(function (location) {
                        contentStr += getTr(
                            location.name,
                            that.timesToStr(location.weeks[0][today].times)
                        );
                    });
                    contentStr += '</tbody></table>'; // TODO: link in tfoot to be inserted here!
                }
            } else {
                var libraryHours = that.getLibraryHours(library);
                if (!libraryHours) {
                    throw new ReferenceError('Requested library "' + library + '" does not exist in libCal.', 'openingHours');
                }
                if (timespan === 'day') {
                    // --- [ lib day ] ---
                    contentStr += '<table>' + that.getThead(that.config.i18n.library, that.config.i18n.openHourToday) + '<tbody>';
                    today = getDayName();
                    contentStr += getTr(library, that.timesToStr(libraryHours.weeks[0][today].times));
                    contentStr += '</tbody></table>';
                } else {
                    // --- [ lib week ] ---
                    contentStr += '<table>' + that.getThead(library, this.config.i18n.openHour) + '<tbody>';
                    this.config.i18n.weekdays.forEach(function (weekday, index) {
                        contentStr += getTr(weekday, that.timesToStr(libraryHours.weeks[0][weekdays[(index + 1) % 7]].times));
                    });
                    contentStr += '</tbody></table>';
                }
            } 
            return contentStr;
        },

        // --- helper functions
        getLibraryHours : function (library) {
            if (!this.openingHours) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this;
            for (var i = 0; i < that.openingHours.locations.length; i += 1) {
                if (that.openingHours.locations[i].name === library) {
                    return that.openingHours.locations[i];
                }
            }
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
         * Returns a html string where all arguments are wrapped in. Format: "<thead><tr><th>arg1</th><th>arg2</th>...</tr></thead>" tags.
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

    };

    return OpeningHours;
})(window.document);

function loadOpeningHours001(data) { // FIXME: This should be done more dynamic - right now it loads data for one week for all libraries once. Preferable it should be managing what to load (no need to fetch all libs all week every time?), and load more on the fly when necessary. If the data is small and the structure of the different feeds is diverse, it might not be worth the effort though?
    window.openingHours = new OpeningHours(data);
    window.openingHours.init(OpeningHours.config);
}

