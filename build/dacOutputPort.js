"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DacOutputPort = void 0;
const I2C = __importStar(require("i2c-bus"));
const megabasConstants_1 = require("./megabasConstants");
/**
 * Defines an analog output port
 */
class DacOutputPort {
    constructor(megabas, card, portNumber) {
        this._megabas = megabas;
        this._card = card;
        this._portNumber = portNumber;
        this._baseObjName = this._card.objectName + ".dacOutputPort:" + portNumber.toString();
        this._currentVoltage = 0;
    }
    // Returns the name of the device object in ioBroker
    get objectName() {
        return this._baseObjName;
    }
    /**
     * Initializes the states in the ioBroker object model
     */
    async InitializeOutputPort() {
        const channelBaseName = this._baseObjName;
        await this._megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "DAC output port number " + (this._portNumber + 1).toString(),
            },
            native: {},
        });
        await this._megabas.setObjectNotExistsAsync(channelBaseName + ".voltage", {
            type: "state",
            common: {
                name: "Sets the output voltage value",
                type: "number",
                role: "level",
                min: 0,
                max: 10000,
                read: true,
                write: true,
            },
            native: {},
        });
    }
    /**
     * Subscribes the relevant properties to changes from ioBroker
     */
    SubscribeStates() {
        this._megabas.subscribeStates(this._baseObjName + ".voltage");
    }
    /**
     * State update from ioBroker received: Process it and update the internal variables
     * @param fullId The full name of the state to update including path
     * @param state The name of the state to update
     * @param val The value to set
     */
    SetState(fullId, state, val) {
        if (state === "voltage") {
            if (val && typeof val === "number") {
                this.UpdateValue(val);
            }
            else {
                this.UpdateValue(0);
            }
        }
    }
    /**
     * Sets the new value on the output port on the card
     * @param newValue The new value to write to the output port
     */
    UpdateValue(newValue) {
        if (newValue != this._currentVoltage) {
            if (newValue < 0) {
                this._megabas.log.warn(`${this._baseObjName}: Value ${newValue} is not valid. Setting value to 0`);
                newValue = 0;
            }
            if (newValue > 10000) {
                this._megabas.log.warn(`${this._baseObjName}: Value ${newValue} is not valid. Setting value to 10000`);
                newValue = 10000;
            }
            this._currentVoltage = newValue;
            this._megabas.log.debug(`${this._baseObjName}: Setting output value to ${this._currentVoltage}`);
            const i2cBus = I2C.open(1, (err) => {
                if (err) {
                    this._megabas.log.error(`${this._baseObjName}: error connecting to i2c-bus: ${err}`);
                    return;
                }
                const hwAddress = megabasConstants_1.MegabasConstants.U0_10_OUT_VAL1_ADD + 2 * this._portNumber;
                i2cBus.writeWord(this._card.hwBaseAddress, hwAddress, this._currentVoltage, (err) => {
                    if (err) {
                        this._megabas.log.error(`${this._baseObjName}: error setting output voltage ${this._currentVoltage}: ${err}`);
                    }
                    i2cBus.close((err) => {
                        if (err) {
                            this._megabas.log.error(`${this._baseObjName}: error closing i2c-bus: ${err}`);
                        }
                    });
                });
            });
        }
    }
}
exports.DacOutputPort = DacOutputPort;
