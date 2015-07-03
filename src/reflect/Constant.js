var types = require("../types");

var BaseOperand = require("../stmt/BaseOperand");

/**
 * A global constant.
 * @constructor
 * @param {!Assembly} assembly
 * @param {number} type
 * @param {number} value
 * @extends stmt.BaseOperand
 * @exports reflect.Constant
 */
function Constant(assembly, type, value) {
    BaseOperand.call(this);

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
}

module.exports = Constant;

// Extends BaseOperand
Constant.prototype = Object.create(BaseOperand.prototype);

/**
 * Constant index in the constant pool of its respective type.
 * @name reflect.Constant#index
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
