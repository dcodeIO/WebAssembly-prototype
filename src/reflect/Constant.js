var types = require("../types");

/**
 * A global constant.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} type
 * @param {number} value
 */
var Constant = module.exports = function(assembly, type, value) {

    /**
     * Assembly reference.
     * @type {!Assembly}
     */
    this.assembly = assembly;

    /**
     * Constant type.
     * @type {number}
     */
    this.type = type;

    /**
     * Constant value.
     * @type {number}
     */
    this.value = value;
};

/**
 * Constant index in the constant pool of its respective type.
 * @name GlobalConstant#index
 * @type {number}
 */
Object.defineProperty(Constant.prototype, "index", {
    get: function() {
        switch (this.type) {
            case types.Type.I32:
                return this.assembly.constantsI32.indexOf(this);
            case types.Type.F32:
                return this.assembly.constantsF32.indexOf(this);
            case types.Type.F64:
                return this.assembly.constantsF64.indexOf(this);
        }
    }
});
