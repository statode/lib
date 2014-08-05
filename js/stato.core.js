
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Javascript Monkey Patches
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Array.prototype.shuffle = function() {
    for (var j, x, i = this.length; i; j = parseInt(Math.random() * i), x = this[--i], this[i] = this[j], this[j] = x);
    return this;
};

Array.prototype.random = function() {
    return this[Math.floor(Math.random()*this.length)];
};

Array.crossp = function() {
    var r = [], arg = arguments, max = arg.length-1;
    function helper(arr, i) {
        for (var j=0, l=arg[i].length; j<l; j++) {
            var a = arr.slice(0);
            a.push(arg[i][j])
            if (i==max) {
                r.push(a);
            } else
                helper(a, i+1);
        }
    }
    helper([], 0);
    return r;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Stato
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.stato = window.stato || {};

(function(stato) {

    var module = {
        templates: {}
    }

    stato.Config = function(def) {
        try {
            var search = window.location.search.substring(1, window.location.search.length),
                config = JSON.parse(unescape(search));
            console.log("Configuration", config)
            return config ? config : def;
        } catch(err) {
            console.log("Configuration ERROR", err)
            return def;
        }
    } 

    stato.Configuration = function(def) {

        var config = stato.Config(def);

        return config;

        // try {
        //     var search = window.location.search.substring(1, window.location.search.length),
        //         config = JSON.parse(unescape(search));
        //     console.log("Configuration", config)
        //     return config ? config : def;
        // } catch(err) {
        //     console.log("Configuration ERROR", err)
        //     return def;
        // }
    } 

    stato.Iterator = function(array) {
        var i = 0;
        return function() {
            return array[i++];
        }
    };

    stato.Director = function(actors, callback, timeout) {

        timeout = timeout || Infinity;

        // apply default iterator
        if (!(actors instanceof Function)) {
            actors = stato.Iterator(actors);
        }

        var _dir_ = function(callback) {


            var res = [];

            var onset = new Date().getTime();

            var taskIterator = function() {

                // get the next actor form the iterator
                var actor = actors(res);

                if (actor && ((new Date().getTime() - onset) < timeout)) {
                   actor(taskFinished);
                }
                else {
                    callback(res);
                }
            }

            var taskFinished = function(ret) {
                if (ret !== undefined && ret !== null) {
                    res.push(ret);
                }
                taskIterator();
            }

            taskIterator();
        }

        return callback !== undefined ? _dir_(callback) : _dir_;

    };

    stato.Trial = function(frame) {
        // signals completion via callback

        return function(callback) {

            var onset = new Date().getTime();

            var env = {
                time: 0
            };

            var loop = function() {
                if (frame) {
                    // update the clock
                    env.time = new Date().getTime() - onset;
                    // update the frame
                    frame = frame(env);
                    // register timeout
                    setTimeout(loop, 0);
                }
                else {
                    document.removeEventListener('reaction', handler, true)
                    // instructions et al. may set the ignore flag
                    if (env.ignore === undefined) {
                        callback(env);
                    }
                    else {
                        callback(null);
                    }
                }
            }

            // register to 'reaction' events i.e. keyboard or touch events
            // publish the event to the trial's frames via env.events
            var handler;
            document.addEventListener('reaction', handler = function(event) {
                env.events = env.events || [];
                env.events.push({
                    event: event.payload.event,
                    // Firefox problem
                    // time: event.timeStamp - onset
                    time: new Date().getTime() - onset
                });
            },
            true);

            setTimeout(loop, 0);
        }
    };

    stato.Frame = function(options)  {

        var frame = function(env) {
            // once
            if(frame.onset === undefined) {
                frame.onset = env.time;
                
                if(options.init) {
                    options.init.apply(frame, [env]);
                }
            }
            // always
            if (options.body) {
                var next = options.body.apply(frame, [env]);

                if(next !== frame && options.exit) {
                    options.exit.apply(frame, [env]);
                }

                return next;
            }
            else {
                return null;
            }
        };
        
        return frame;
    };

    stato.Instruction = function(id, options) {

        var frame = function(env) {
            // do not log instructions
            env.ignore = true;

            if (frame.onset === undefined) {
                frame.onset = env.time;
                
                try {
                    stato.Refresh();
                } catch (ex) {};
                
                $(id).show();

                stato.SUnit.expect("continue", 1000);
            }

            if (env.events === undefined || env.events.length === 0) {
                return frame;
            }
            else {
                if (frame.delayOnset === undefined) {
                    frame.delayOnset = env.time;
                    
                    $(id).hide();
                }
                return env.time < frame.delayOnset+1000 ? frame: null;
            }
        };

        return frame;
    };

    stato.Events = {
        map: function(keys) {
            window.addEventListener('keydown',
            function(event) {
                if (keys[event.keyCode]) {
                    var evt = document.createEvent("Event");
                    evt.initEvent("reaction", true, true);
                    evt.payload = keys[event.keyCode];
                    document.dispatchEvent(evt);
                }
            },
            true);
        },
        trigger: function(event, args) {
            var e = document.createEvent("Event");
            e.initEvent(event, true, true);
            e.payload = args;
            document.dispatchEvent(e);
        }
    };

    stato.Classification = function(env, arg, opt) {
        
        $.extend(env, arg);

        // No reaction
        if (env.events === undefined || env.events.length === 0) {
            env.classification = 'tooslow';
            env.rt = 0;
            env.event = 'N/A';            
        }
        // Reaction
        else {
            // Log
            env.rt = env.events[0].time - opt.onset;
            env.event = env.events[0].event;            
            // Correct response
            if (env.events[0].event == opt.expected || '*' == opt.expected) {
                env.classification = 'correct';
            }
            // Incorrect Response
            else {
                env.classification = 'incorrect';
            }
        }
    };


    stato.SUnit = {
        run: function() {
            document.addEventListener('expected', function(event) {
                setTimeout(function() {
                    stato.Events.trigger('reaction', {event: event.payload.event})
                }, event.payload.timeout);
            }, 
            true);
        },
        expect: function(event, timeout) {
            stato.Events.trigger("expected", {event: event, timeout: timeout});
        }
    };

    stato.Template = function(name, id) {
        if(arguments.length == 2) {
            $(function() {
                // precompile template
                module.templates[name] = _.template($(id).html());
            })
        }
        if(arguments.length == 1) {
            return module.templates[name];
        }
    }

    window.UNIT = window.unit = stato.SUnit.run;

})(window.stato);

