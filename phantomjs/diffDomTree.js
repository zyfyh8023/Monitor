/**
 * equal
 * @param {Object} left
 * @param {Object} right
 * @returns {boolean}
 */
function equal(left, right) {
    var type = typeof left;
    if (type === typeof right) {
        switch (type) {
            case 'object':
                var lKeys = Object.keys(left);
                var rKeys = Object.keys(right);
                if (lKeys.length === rKeys.length) {
                    for (var i = 0; i < lKeys.length; i++) {
                        var key = lKeys[i];
                        if (!right.hasOwnProperty(key) || (left[key] !== right[key])) {
                            return false;
                        }
                    }
                    return true;
                } else {
                    return false;
                }
                break;
            default:
                return left === right;
        }
    } else {
        return false;
    }
}

function equalText(left, right) {
    if (left) {
        return left === right;
    } else {
        return false;
    }
}

function trueMatch(left, right) {
    if (left.child && right.child && left.child.length == right.child.length) {
        for (var i = 0, len = left.child.length; i < len; i++) {
            if (!isMatch2(left.child[i], right.child[i])) {
                return false;
            }
        }
    } else {
        return false;
    }
    return true;
}
/**
 * match
 * @param {Object} left
 * @param {Object} right
 * @returns {boolean}
 */
function isMatch0(left, right) {
    return (left.name === right.name) && equal(left.attr, right.attr) && equal(left.otherAttr, right.otherAttr) && trueMatch(left, right);
}

function isMatch1(left, right) {
    return (left.name === right.name) && equal(left.attr, right.attr) && equal(left.otherAttr, right.otherAttr);
}

function isMatch2(left, right) {
    return (left.name === right.name) && (equalText(left.text, right.text) || equal(left.attr, right.attr) || equal(left.otherAttr, right.otherAttr));
}
/**
 * common logic of `LCSHeadFirst’ and `LCSTailFirst‘
 * @param {Object} old
 * @param {Object} cur
 * @param {Function} match
 * @param {Number} x
 * @param {Array} lastLine
 * @param {Array} currLine
 */
function LCSProc(old, cur, match, sequence) {

    if (!(cur.matched)) {
        if (match(old, cur)) {
            cur.matched = old.matched = true;
            sequence.push({
                l: old,
                r: cur
            });
            return true;
        }
    }
    return false;
}

/**
 * Longest common subsequence (reverse)
 * @param {Array} left
 * @param {Array} right
 * @param {Function} match
 * @returns {Array}
 */
function LCSHeadFirst(left, right, match0, match1, match2) {
    var sequence = [];

    for (var i = 0; i < left.length; i++) {
        for (var j = 0; j < right.length; j++) {
            var sign = LCSProc(left[i], right[j], match0, sequence);
            if (sign) break;
        }
    }
    for (var i = 0; i < left.length; i++) {
        if (!left[i].matched) {
            for (var j = 0; j < right.length; j++) {
                var sign = LCSProc(left[i], right[j], match1, sequence);
                if (sign) break;
            }
        }
    }
    for (var i = 0; i < left.length; i++) {
        if (!left[i].matched) {
            for (var j = 0; j < right.length; j++) {
                var sign = LCSProc(left[i], right[j], match2, sequence);
                if (sign) break;
            }
        }
    }

    return sequence;
}

/**
 * diff change
 * @param {Object} left
 * @param {Object} right
 * @param {Object} opt
 * @returns {Array}
 */
var CHANGE_TYPE = {
    ADD: 1,
    REMOVE: 2,
    STYLE: 3,
    TEXT: 4 //文字不同暂不标记
};
var diff = function(left, right) {
    var ret = [];
    var change = {
        type: 0,
        node: right,
        matched: true
    };
    if (left.style !== right.style) {
        change.type = CHANGE_TYPE.STYLE;
    }
    LCSHeadFirst(left.child, right.child, isMatch0, isMatch1, isMatch2).forEach(function(node) {
        var old = node.l;
        var cur = node.r;
        if (cur.name === '#') {
            if (old.text !== cur.text) {
                // change.type = CHANGE_TYPE.TEXT;
            }
        } else {
            // recursive
            ret = ret.concat(diff(old, cur));
        }
    });
    right.child.forEach(function(node) {
        if (!node.matched) {
            if (node.name === '#') {
                // change.type = CHANGE_TYPE.TEXT;
            } else {
                ret.push({
                    type: CHANGE_TYPE.ADD,
                    node: node,
                });
            }
        }
    });
    left.child.forEach(function(node) {
        if (!node.matched) {
            if (node.name === '#') {
                // change.type = CHANGE_TYPE.TEXT;
            } else {
                ret.push({
                    type: CHANGE_TYPE.REMOVE,
                    node: node
                });
            }
        }
    });
    if (change.type) {
        ret.push(change);
    }
    return ret;
};

module.exports = diff;