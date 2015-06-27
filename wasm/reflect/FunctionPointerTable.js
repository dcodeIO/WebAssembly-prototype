var FunctionPointerElement = require("./FunctionPointerElement");

/**
 * A function pointer table.
 * @constructor
 * @param {!Assembly} assembly
 * @param {!Array.<number>=} elements
 */
var FunctionPointerTable = module.exports = function(assembly, elements) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Elements.
     * @type {!Array.<!FunctionPointerElement>}
     */
    this.elements = [];

    if (elements)
        for (var i=0; i<elements.length; ++i)
            this.elements.push(new FunctionPointerElement(this, elements[i]));
};
