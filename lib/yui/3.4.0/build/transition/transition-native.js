/*
YUI 3.4.0 (build 3928)
Copyright 2011 Yahoo! Inc. All rights reserved.
Licensed under the BSD License.
http://yuilibrary.com/license/
*/
YUI.add('transition-native', function(Y) {

/**
* Provides the transition method for Node.
* Transition has no API of its own, but adds the transition method to Node.
*
* @module transition
* @requires node-style
*/

var TRANSITION = '-webkit-transition',
    TRANSITION_CAMEL = 'WebkitTransition',
    TRANSITION_PROPERTY_CAMEL = 'WebkitTransitionProperty',
    TRANSITION_PROPERTY = '-webkit-transition-property',
    TRANSITION_DURATION = '-webkit-transition-duration',
    TRANSITION_TIMING_FUNCTION = '-webkit-transition-timing-function',
    TRANSITION_DELAY = '-webkit-transition-delay',
    TRANSITION_END = 'webkitTransitionEnd',
    ON_TRANSITION_END = 'onwebkittransitionend',
    TRANSFORM_CAMEL = 'WebkitTransform',

    EMPTY_OBJ = {},

/**
 * A class for constructing transition instances.
 * Adds the "transition" method to Node.
 * @class Transition
 * @constructor
 */

Transition = function() {
    this.init.apply(this, arguments);
};

Transition.fx = {};
Transition.toggles = {};

Transition._hasEnd = {};

Transition._toCamel = function(property) {
    property = property.replace(/-([a-z])/gi, function(m0, m1) {
        return m1.toUpperCase();
    });

    return property;
};

Transition._toHyphen = function(property) {
    property = property.replace(/([A-Z]?)([a-z]+)([A-Z]?)/g, function(m0, m1, m2, m3) {
        var str = '';
        if (m1) {
            str += '-' + m1.toLowerCase();
        }
        str += m2;
        
        if (m3) {
            str += '-' + m3.toLowerCase();
        }

        return str;
    }); 

    return property;
};


Transition._reKeywords = /^(?:node|duration|iterations|easing|delay|on|onstart|onend)$/i;

Transition.useNative = false;

if (TRANSITION in Y.config.doc.documentElement.style) {
    Transition.useNative = true;
    Transition.supported = true; // TODO: remove
}

Y.Node.DOM_EVENTS[TRANSITION_END] = 1; 

Transition.NAME = 'transition';

Transition.DEFAULT_EASING = 'ease';
Transition.DEFAULT_DURATION = 0.5;
Transition.DEFAULT_DELAY = 0;

Transition._nodeAttrs = {};

Transition.prototype = {
    constructor: Transition,
    init: function(node, config) {
        var anim = this;
        anim._node = node;
        if (!anim._running && config) {
            anim._config = config;
            node._transition = anim; // cache for reuse

            anim._duration = ('duration' in config) ?
                config.duration: anim.constructor.DEFAULT_DURATION;

            anim._delay = ('delay' in config) ?
                config.delay: anim.constructor.DEFAULT_DELAY;

            anim._easing = config.easing || anim.constructor.DEFAULT_EASING;
            anim._count = 0; // track number of animated properties
            anim._running = false;

        }

        return anim;
    },

    addProperty: function(prop, config) {
        var anim = this,
            node = this._node,
            uid = Y.stamp(node),
            nodeInstance = Y.one(node),
            attrs = Transition._nodeAttrs[uid],
            computed,
            compareVal,
            dur,
            attr,
            val;

        if (!attrs) {
            attrs = Transition._nodeAttrs[uid] = {};
        }

        attr = attrs[prop];

        // might just be a value
        if (config && config.value !== undefined) {
            val = config.value;
        } else if (config !== undefined) {
            val = config; 
            config = EMPTY_OBJ;
        }

        if (typeof val === 'function') {
            val = val.call(nodeInstance, nodeInstance);
        }

        if (attr && attr.transition) {
            // take control if another transition owns this property
            if (attr.transition !== anim) {
                attr.transition._count--; // remapping attr to this transition
            }
        } 

        anim._count++; // properties per transition

        // make 0 async and fire events
        dur = ((typeof config.duration != 'undefined') ? config.duration :
                    anim._duration) || 0.0001;

        attrs[prop] = {
            value: val,
            duration: dur,
            delay: (typeof config.delay != 'undefined') ? config.delay :
                    anim._delay,

            easing: config.easing || anim._easing,

            transition: anim
        };

        // native end event doesnt fire when setting to same value
        // supplementing with timer
        // val may be a string or number (height: 0, etc), but computedStyle is always string
        computed = Y.DOM.getComputedStyle(node, prop);
        compareVal = (typeof val === 'string') ? computed : parseFloat(computed);

        if (Transition.useNative && compareVal === val) {
            setTimeout(function() {
                anim._onNativeEnd.call(node, {
                    propertyName: prop,
                    elapsedTime: dur
                });
            }, dur * 1000);
        }
    },

    removeProperty: function(prop) {
        var anim = this,
            attrs = Transition._nodeAttrs[Y.stamp(anim._node)];

        if (attrs && attrs[prop]) {
            delete attrs[prop];
            anim._count--;
        }

    },

    initAttrs: function(config) {
        var attr,
            node = this._node;

        if (config.transform && !config[TRANSFORM_CAMEL]) {
            config[TRANSFORM_CAMEL] = config.transform;
            delete config.transform; // TODO: copy
        }

        for (attr in config) {
            if (config.hasOwnProperty(attr) && !Transition._reKeywords.test(attr)) {
                this.addProperty(attr, config[attr]);

                // when size is auto or % webkit starts from zero instead of computed 
                // (https://bugs.webkit.org/show_bug.cgi?id=16020)
                // TODO: selective set
                if (node.style[attr] === '') {
                    Y.DOM.setStyle(node, attr, Y.DOM.getComputedStyle(node, attr));
                }
            }
        }
    },

    /**
     * Starts or an animation.
     * @method run
     * @chainable
     * @private
     */    
    run: function(callback) {
        var anim = this,
            node = anim._node,
            config = anim._config,
            data = {
                type: 'transition:start',
                config: config
            };


        if (!anim._running) {
            anim._running = true;

            //anim._node.fire('transition:start', data);

            if (config.on && config.on.start) {
                config.on.start.call(Y.one(node), data);
            }

            anim.initAttrs(anim._config);

            anim._callback = callback;
            anim._start();
        }


        return anim;
    },

    _start: function() {
        this._runNative();
    },

    _prepDur: function(dur) {
        dur = parseFloat(dur);

        return dur + 's';
    },

    _runNative: function(time) {
        var anim = this,
            node = anim._node,
            uid = Y.stamp(node),
            style = node.style,
            computed = getComputedStyle(node),
            attrs = Transition._nodeAttrs[uid],
            cssText = '',
            cssTransition = computed[TRANSITION_PROPERTY],

            transitionText = TRANSITION_PROPERTY + ': ',
            duration = TRANSITION_DURATION + ': ',
            easing = TRANSITION_TIMING_FUNCTION + ': ',
            delay = TRANSITION_DELAY + ': ',
            hyphy,
            attr,
            name;

        // preserve existing transitions
        if (cssTransition !== 'all') {
            transitionText += cssTransition + ',';
            duration += computed[TRANSITION_DURATION] + ',';
            easing += computed[TRANSITION_TIMING_FUNCTION] + ',';
            delay += computed[TRANSITION_DELAY] + ',';

        }

        // run transitions mapped to this instance
        for (name in attrs) {
            hyphy = Transition._toHyphen(name);
            attr = attrs[name];
            if (attrs.hasOwnProperty(name) && attr.transition === anim) {
                if (name in node.style) { // only native styles allowed
                    duration += anim._prepDur(attr.duration) + ',';
                    delay += anim._prepDur(attr.delay) + ',';
                    easing += (attr.easing) + ',';

                    transitionText += hyphy + ',';
                    cssText += hyphy + ': ' + attr.value + '; ';
                } else {
                    this.removeProperty(name);
                }
            }
        }

        transitionText = transitionText.replace(/,$/, ';');
        duration = duration.replace(/,$/, ';');
        easing = easing.replace(/,$/, ';');
        delay = delay.replace(/,$/, ';');

        // only one native end event per node
        if (!Transition._hasEnd[uid]) {
            //anim._detach = Y.on(TRANSITION_END, anim._onNativeEnd, node);
            //node[ON_TRANSITION_END] = anim._onNativeEnd;
            node.addEventListener(TRANSITION_END, anim._onNativeEnd, false);
            Transition._hasEnd[uid] = true;

        }
        
        //setTimeout(function() { // allow updates to apply (size fix, onstart, etc)
            style.cssText += transitionText + duration + easing + delay + cssText;
        //}, 1);

    },

    _end: function(elapsed) {
        var anim = this,
            node = anim._node,
            callback = anim._callback,
            config = anim._config,
            data = {
                type: 'transition:end',
                config: config,
                elapsedTime: elapsed 
            },

            nodeInstance = Y.one(node); 

        anim._running = false;
        anim._callback = null;

        if (node) {
            if (config.on && config.on.end) {
                setTimeout(function() { // IE: allow previous update to finish
                    config.on.end.call(nodeInstance, data);

                    // nested to ensure proper fire order
                    if (callback) {
                        callback.call(nodeInstance, data);
                    }

                }, 1);
            } else if (callback) {
                setTimeout(function() { // IE: allow previous update to finish
                    callback.call(nodeInstance, data);
                }, 1);
            }
            //node.fire('transition:end', data);
        }

    },

    _endNative: function(name) {
        var node = this._node,
            value = node.ownerDocument.defaultView.getComputedStyle(node, '')[TRANSITION_PROPERTY];

        if (typeof value === 'string') {
            value = value.replace(new RegExp('(?:^|,\\s)' + name + ',?'), ',');
            value = value.replace(/^,|,$/, '');
            node.style[TRANSITION_CAMEL] = value;
        }
    },

    _onNativeEnd: function(e) {
        var node = this,
            uid = Y.stamp(node),
            event = e,//e._event,
            name = Transition._toCamel(event.propertyName),
            elapsed = event.elapsedTime,
            attrs = Transition._nodeAttrs[uid],
            attr = attrs[name],
            anim = (attr) ? attr.transition : null,
            data,
            config;

        if (anim) {
            anim.removeProperty(name);
            anim._endNative(name);
            config = anim._config[name];

            data = {
                type: 'propertyEnd',
                propertyName: name,
                elapsedTime: elapsed,
                config: config
            };

            if (config && config.on && config.on.end) {
                config.on.end.call(Y.one(node), data);
            }

            //node.fire('transition:propertyEnd', data);

            if (anim._count <= 0)  { // after propertyEnd fires
                anim._end(elapsed);
            }
        }
    },

    destroy: function() {
        var anim = this;
        /*
        if (anim._detach) {
            anim._detach.detach();
        }
        */
        //anim._node[ON_TRANSITION_END] = null;
        node.removeEventListener(TRANSITION_END, anim._onNativeEnd, false);
        anim._node = null;
    }
};

Y.Transition = Transition;
Y.TransitionNative = Transition; // TODO: remove

/** 
 *   Animate one or more css properties to a given value. Requires the "transition" module.
 *   <pre>example usage:
 *       Y.one('#demo').transition({
 *           duration: 1, // in seconds, default is 0.5
 *           easing: 'ease-out', // default is 'ease'
 *           delay: '1', // delay start for 1 second, default is 0
 *
 *           height: '10px',
 *           width: '10px',
 *
 *           opacity: { // per property
 *               value: 0,
 *               duration: 2,
 *               delay: 2,
 *               easing: 'ease-in'
 *           }
 *       });
 *   </pre>
 *   @for Node
 *   @method transition
 *   @param {Object} config An object containing one or more style properties, a duration and an easing.
 *   @param {Function} callback A function to run after the transition has completed. 
 *   @chainable
*/
Y.Node.prototype.transition = function(name, config, callback) {
    var 
        transitionAttrs = Transition._nodeAttrs[Y.stamp(this._node)],
        anim = (transitionAttrs) ? transitionAttrs.transition || null : null,
        fxConfig,
        prop;
    
    if (typeof name === 'string') { // named effect, pull config from registry
        if (typeof config === 'function') {
            callback = config;
            config = null;
        }

        fxConfig = Transition.fx[name];

        if (config && typeof config !== 'boolean') {
            config = Y.clone(config);

            for (prop in fxConfig) {
                if (fxConfig.hasOwnProperty(prop)) {
                    if (! (prop in config)) {
                        config[prop] = fxConfig[prop]; 
                    }
                }
            }
        } else {
            config = fxConfig;
        }

    } else { // name is a config, config is a callback or undefined
        callback = config;
        config = name;
    }

    if (anim && !anim._running) {
        anim.init(this, config);
    } else {
        anim = new Transition(this._node, config);
    }

    anim.run(callback);
    return this;
};

Y.Node.prototype.show = function(name, config, callback) {
    this._show(); // show prior to transition
    if (name && Y.Transition) {
        if (typeof name !== 'string' && !name.push) { // named effect or array of effects supercedes default
            if (typeof config === 'function') {
                callback = config;
                config = name;
            }
            name = this.SHOW_TRANSITION; 
        }    
        this.transition(name, config, callback);
    }    
    return this;
};

var _wrapCallBack = function(anim, fn, callback) {
    return function() {
        if (fn) {
            fn.call(anim);
        }
        if (callback) {
            callback.apply(anim._node, arguments);
        }
    };
};

Y.Node.prototype.hide = function(name, config, callback) {
    if (name && Y.Transition) {
        if (typeof config === 'function') {
            callback = config;
            config = null;
        }

        callback = _wrapCallBack(this, this._hide, callback); // wrap with existing callback
        if (typeof name !== 'string' && !name.push) { // named effect or array of effects supercedes default
            if (typeof config === 'function') {
                callback = config;
                config = name;
            }
            name = this.HIDE_TRANSITION; 
        }    
        this.transition(name, config, callback);
    } else {
        this._hide();
    }    
    return this;
}; 

/** 
 *   Animate one or more css properties to a given value. Requires the "transition" module.
 *   <pre>example usage:
 *       Y.all('.demo').transition({
 *           duration: 1, // in seconds, default is 0.5
 *           easing: 'ease-out', // default is 'ease'
 *           delay: '1', // delay start for 1 second, default is 0
 *
 *           height: '10px',
 *           width: '10px',
 *
 *           opacity: { // per property
 *               value: 0,
 *               duration: 2,
 *               delay: 2,
 *               easing: 'ease-in'
 *           }
 *       });
 *   </pre>
 *   @for NodeList
 *   @method transition
 *   @param {Object} config An object containing one or more style properties, a duration and an easing.
 *   @param {Function} callback A function to run after the transition has completed. The callback fires
 *       once per item in the NodeList.
 *   @chainable
*/
Y.NodeList.prototype.transition = function(config, callback) {
    var nodes = this._nodes,
        i = 0,
        node;

    while ((node = nodes[i++])) {
        Y.one(node).transition(config, callback);
    }

    return this;
};

Y.Node.prototype.toggleView = function(name, on, callback) {
    this._toggles = this._toggles || [];
    callback = arguments[arguments.length - 1];

    if (typeof name == 'boolean') { // no transition, just toggle
        on = name;
        name = null;
    }

    name = name || Y.Transition.DEFAULT_TOGGLE;

    if (typeof on == 'undefined' && name in this._toggles) { // reverse current toggle
        on = ! this._toggles[name];
    }

    on = (on) ? 1 : 0;
    if (on) {
        this._show();
    }  else {
        callback = _wrapCallBack(this, this._hide, callback);
    }

    this._toggles[name] = on;
    this.transition(Y.Transition.toggles[name][on], callback);

    return this;
};

Y.NodeList.prototype.toggleView = function(name, on, callback) {
    var nodes = this._nodes,
        i = 0,
        node;

    while ((node = nodes[i++])) {
        Y.one(node).toggleView(name, on, callback);
    }

    return this;
};

Y.mix(Transition.fx, {
    fadeOut: {
        opacity: 0,
        duration: 0.5,
        easing: 'ease-out'
    },

    fadeIn: {
        opacity: 1,
        duration: 0.5,
        easing: 'ease-in'
    },

    sizeOut: {
        height: 0,
        width: 0,
        duration: 0.75,
        easing: 'ease-out'
    },

    sizeIn: {
        height: function(node) {
            return node.get('scrollHeight') + 'px';
        },
        width: function(node) {
            return node.get('scrollWidth') + 'px';
        },
        duration: 0.5,
        easing: 'ease-in',
        
        on: {
            start: function() {
                var overflow = this.getStyle('overflow');
                if (overflow !== 'hidden') { // enable scrollHeight/Width
                    this.setStyle('overflow', 'hidden');
                    this._transitionOverflow = overflow;
                }
            },

            end: function() {
                if (this._transitionOverflow) { // revert overridden value
                    this.setStyle('overflow', this._transitionOverflow);
                    delete this._transitionOverflow;
                }
            }
        } 
    }
});

Y.mix(Transition.toggles, {
    size: ['sizeOut', 'sizeIn'],
    fade: ['fadeOut', 'fadeIn']
});

Transition.DEFAULT_TOGGLE = 'fade';



}, '3.4.0' ,{requires:['node-base']});
