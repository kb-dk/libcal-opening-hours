/*global window, console*/
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

    function ampmTo24(str) {
        if (str.indexOf('am') >= 0) {
            return parseInt(str, 10).toString();
        }
        if (str.indexOf('pm') >= 0) {
            return (parseInt(str, 10) + 12).toString();
        }
        return str;
    }

    function timesToStr(times) {
        if (times.status !== 'open') {
            return 'Lukket';
        }
        var str = '';
        for (var i = 0; i < times.hours.length; i += 1) {
            str += ampmTo24(times.hours[i].from) + ' - ' + ampmTo24(times.hours[i].to);
            if (i !== times.hours.length - 1) {
                str += ', ';
            }
        }
        return str;
    }

    /**
     * Returns a html string where all arguments are wrapped in. Format: "<thead><tr><th>arg1</th><th>arg2</th>...</tr></thead>" tags.
     * Also adds class first and last to the first and last header
     * NOTE: Must have a colorscheme as first parameter like 'standard01'
     */
    function getThead(colorScheme) {
        var str = '<thead><tr class="' + (colorScheme || 'standard') + '">';
        if (arguments.length < 3) {
            return str + '<th class="first last">' + (arguments[1] || '') + '</th></tr></thead>';
        } else {
            str += '<th class="first">' + arguments[1] + '</th>';
            for (var i = 2; i < arguments.length - 1; i += 1) {
                str += '<th>' + arguments[i] + '</th>';
            }
            return str + '<th class="last">' + arguments[arguments.length-1] + '</th></tr></thead>';
        }
    }

    function getTr() {
        var str = '<tr class="' + (nextRowIsOdd? 'odd' : 'even') + '">';
        nextRowIsOdd = !nextRowIsOdd;
        for (var i = 0; i < arguments.length; i += 1) {
            str += '<td' + (i > 0 ? ' class="center"' : '') + '>' + arguments[i] + '</td>';
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
            this.setView(this.config.library, this.config.timespan);
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
         * @param library {String} A string representation of the library that is requested. Needs to be the same as defined in libCal.Hours, or 'all' for all libraries.
         * @param timespan {String} The timespan to view. Either 'day' or 'week'.
         */
        setView : function (library, timespan) {
            if (!this.viewCache) {
                throw new NotInitializedError('Object hasn\'t been initialized yet.');
            }
            var that = this,
                viewId = library + ':' + timespan;
            if (that.viewCache[viewId]) {
                that.turnOffAllViews();
                that.viewCache[viewId].style.display = 'block';
            } else {
                try{
                    that.renderView(library, timespan);
                    that.setView(library, timespan);
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
                    // all week
                    contentStr += '<table>' + getThead(this.config.colorScheme, 'Bibliotek','m','t','o','t','f','l','s') + '<tbody>'; // TODO: check weekday abbrevations
                    that.openingHours.locations.forEach(function (location) {
                        contentStr += getTr(
                            location.name,
                            timesToStr(location.weeks[0].Monday.times),
                            timesToStr(location.weeks[0].Tuesday.times),
                            timesToStr(location.weeks[0].Wednesday.times),
                            timesToStr(location.weeks[0].Thursday.times),
                            timesToStr(location.weeks[0].Friday.times),
                            timesToStr(location.weeks[0].Saturday.times),
                            timesToStr(location.weeks[0].Sunday.times)
                        );
                    });
                    contentStr += '</tbody></table>'; // TODO: link in tfoot to be inserted here!
                } else {
                    // all day
                    contentStr += '<table>' + getThead(this.config.colorScheme, 'Bibliotek', 'Dagens åbningstid') + '<tbody>';
                    today = getDayName(); // TODO: We could check for dates too, to invalidate these?
                    that.openingHours.locations.forEach(function (location) {
                        contentStr += getTr(
                            location.name,
                            timesToStr(location.weeks[0][today].times)
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
                    // lib day
                    contentStr += '<table>' + getThead(this.config.colorScheme, 'Bibliotek', 'Dagens åbningstid') + '<tbody>';
                    today = getDayName();
                    contentStr += getTr(library, timesToStr(libraryHours.weeks[0][today].times));
                    contentStr += '</tbody></table>';
                } else {
                    // lib week
                    contentStr += '<table>' + getThead(this.config.colorScheme, library, 'Åbningstid') + '<tbody>';
                    var tmpWeekdays = weekdays.slice(0);
                    tmpWeekdays.push(tmpWeekdays.shift()); // Danish weeks starts on Monday
                    tmpWeekdays.forEach(function (day) {
                        contentStr += getTr(weekdayToUgedagHash[day], timesToStr(libraryHours.weeks[0][day].times));
                    });
                    contentStr += '</tbody></table>';
                }
            } 
            return contentStr;
        },

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
        }

    };

    return OpeningHours;
})(window.document);

function loadOpeningHours001(data) { // FIXME: This should be done more dynamic - right now it loads data for one week for all libraries once. Preferable it should be managing what to load (no need to fetch all libs all week every time?), and load more on the fly when necessary. If the data is small and the structure of the different feeds is diverse, it might not be worth the effort though?
    window.openingHours = new OpeningHours(data);
    window.openingHours.init(OpeningHours.config);
}

