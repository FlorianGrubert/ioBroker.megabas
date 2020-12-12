"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackableCard = void 0;
const dacOutputPort_1 = require("./dacOutputPort");
const inputPort_1 = require("./inputPort");
const megabasConstants_1 = require("./megabasConstants");
/**
 * Defines one stackable building automation card
 */
class StackableCard {
    constructor(megabas, id) {
        this._megabas = megabas;
        this._id = id.toString();
        this._stackLevel = id;
        this._baseObjName = "stackableCard:" + id;
        this._inputPorts = new Array(8);
        this._dacOutputPorts = new Array(8);
    }
    /**
     * Returns the input ports
     */
    get inputPorts() {
        return this._inputPorts;
    }
    /**
     * Returns the analog output ports
     */
    get dacOutputPorts() {
        return this._dacOutputPorts;
    }
    /**
     * Returns base address of this card in the I2C bus
     */
    get hwBaseAddress() {
        return megabasConstants_1.MegabasConstants.HW_ADD + this._stackLevel;
    }
    /**
     * Returns the name of the device object in ioBroker
     */
    get objectName() {
        return this._baseObjName;
    }
    /**
     * Initializes the states in the ioBroker object model
     */
    async InitializeIoBrokerObjects() {
        await this._megabas.setObjectNotExistsAsync(this._baseObjName, {
            type: "device",
            common: {
                name: "Stackable card level " + this._id,
            },
            native: {},
        });
        for (let i = 0; i < 8; i++) {
            const port = new inputPort_1.InputPort(this._megabas, this, i);
            port.InitializeInputPort();
            this._inputPorts[i] = port;
        }
        for (let i = 0; i < 4; i++) {
            const port = new dacOutputPort_1.DacOutputPort(this._megabas, this, i);
            port.InitializeOutputPort();
            this._dacOutputPorts[i] = port;
        }
    }
    /**
     * Subscribes the necessary properties for updates from ioBroker
     */
    SubscribeStates() {
        this._inputPorts.forEach((port) => {
            port.SubscribeStates();
        });
        this._dacOutputPorts.forEach((port) => {
            port.SubscribeStates();
        });
    }
    /**
     * Reads the current status from the Megabas
     * @param i2cBus The I2C bus to read the the data from
     */
    UpdateI2c(i2cBus) {
        this._megabas.log.silly("Reading i2c status");
        const dryContactStatus = i2cBus.readByteSync(this.hwBaseAddress, megabasConstants_1.MegabasConstants.DRY_CONTACT_VAL_ADD);
        let mask = 1;
        let contactClosed = false;
        for (let i = 0; i < 8; i++) {
            mask = 1 << i;
            contactClosed = (dryContactStatus & mask) > 0;
            this._megabas.log.silly(`${this._baseObjName} contact ${i}: ${contactClosed}`);
            this._inputPorts[i].UpdateValue(contactClosed, i2cBus);
        }
    }
}
exports.StackableCard = StackableCard;
