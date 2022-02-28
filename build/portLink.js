"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightingPortTypes = exports.PortLink = void 0;
const inputPort_1 = require("./inputPort");
var LightingPortTypes;
(function (LightingPortTypes) {
    LightingPortTypes["Output"] = "output";
    LightingPortTypes["Presence"] = "presence";
    LightingPortTypes["Switch"] = "switch";
    LightingPortTypes["Brightness"] = "brightness";
})(LightingPortTypes || (LightingPortTypes = {}));
exports.LightingPortTypes = LightingPortTypes;
/**
 * Class that defines the link to a port (input or output)
 */
class PortLink {
    /**
     * Creates a new port link
     * @param megabas The megabas controller
     * @param lightingDevice The lighting device the portlink is assigned to
     * @param portType The type of the port
     * @param id The id of the port
     */
    constructor(megabas, lightingDevice, portType, id) {
        this._lightingDevice = lightingDevice;
        this._id = id;
        this._cardNumber = 0;
        this._portNumber = 0;
        this._portType = portType;
        this._baseObjName = lightingDevice.objectName + "." + portType.toString() + "Ports:" + id;
        this._megabas = megabas;
    }
    /**
     * The number of the stackable card the port is attached to [1..8]
     */
    get cardNumber() {
        return this._cardNumber;
    }
    /**
     * The number of the stackable card the port is attached to [1..8]
     */
    set cardNumber(value) {
        this._cardNumber = value;
    }
    /**
     * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
     */
    get portNumber() {
        return this._portNumber;
    }
    /**
     * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
     */
    set portNumber(value) {
        this._portNumber = value;
    }
    // Returns the name of the device object in ioBroker
    get objectName() {
        return this._baseObjName;
    }
    /**
     * Initializes the states in the ioBroker object model
     */
    async InitializeIoBrokerObjects() {
        await this._megabas.setObjectNotExistsAsync(this._baseObjName, {
            type: "channel",
            common: {
                name: `${this._portType.toString()}: ${this._id}`,
            },
            native: {},
        });
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".cardNumber", {
            type: "state",
            common: {
                name: "The card number the port is connected to [1..8]",
                type: "number",
                role: "info.port",
                min: 0,
                max: 8,
                def: 0,
                read: true,
                write: true,
            },
            native: {},
        });
        this.SynchronizeState("cardNumber", 0);
        let maxCount = 8;
        switch (this._portType) {
            case LightingPortTypes.Output:
                maxCount = 4;
                break;
            default:
                maxCount = 8;
                break;
        }
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".portNumber", {
            type: "state",
            common: {
                name: `The port number [1..${maxCount}]`,
                type: "number",
                role: "info.port",
                min: 0,
                max: maxCount,
                def: 0,
                read: true,
                write: true,
            },
            native: {},
        });
        this.SynchronizeState("portNumber", 0);
    }
    /**
     * Deletes the objects from ioBroker
     */
    DeleteIoBrokerObjects() {
        this._megabas.delObjectAsync(this._baseObjName + ".cardNumber");
        this._megabas.delObjectAsync(this._baseObjName + ".portNumber");
        this._megabas.delObjectAsync(this._baseObjName);
    }
    /**
     * Reads the content of the state from ioBroker
     * @param stateName Name of the state to read
     * @param defaultValue Default values to set if the state was not set
     */
    SynchronizeState(stateName, defaultValue) {
        this._megabas.getState(this._baseObjName + "." + stateName, (err, state) => {
            if (err) {
                this._megabas.log.error(`${this._baseObjName}: State "${stateName}" not found: ${err}`);
            }
            if (state) {
                this.SetState(this._baseObjName + "." + stateName, stateName, state.val);
            }
            else {
                this.SetState(this._baseObjName + "." + stateName, stateName, defaultValue);
            }
        });
    }
    /**
     * Subscribes the relevant properties to changes from ioBroker
     */
    SubscribeStates() {
        this._megabas.subscribeStates(this._baseObjName + ".cardNumber");
        this._megabas.subscribeStates(this._baseObjName + ".portNumber");
    }
    /**
     * State update from ioBroker received: Process it and update the internal variables
     * @param fullId The full name of the state to update including path
     * @param state The name of the state to update
     * @param nextState If there was a next state property, it is specified here
     * @param val The value to set
     */
    SetState(fullId, state, val) {
        if (state === "cardNumber") {
            if (val) {
                if (typeof val === "number") {
                    if (val < 0 || val > 8) {
                        this._megabas.log.error(`${fullId}: ${val} is an invalid index for a stackable card. Setting card number to 0`);
                        this._cardNumber = 0;
                        this._megabas.setStateAsync(this._baseObjName + ".cardNumber", 0, true);
                    }
                    else {
                        this._cardNumber = val;
                    }
                }
                else {
                    this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
                }
            }
            else {
                this._cardNumber = 0;
            }
        }
        else if (state === "portNumber") {
            if (val) {
                if (typeof val === "number") {
                    let maxIdx = 8;
                    if (this._portType == LightingPortTypes.Output) {
                        maxIdx = 4;
                    }
                    if (val < 0 || val > maxIdx) {
                        this._megabas.log.error(`${fullId}: ${val} is an invalid index for ${this._portType}. Setting port number to 0`);
                        this._portNumber = 0;
                        this._megabas.setStateAsync(this._baseObjName + ".portNumber", 0, true);
                    }
                    else {
                        this._portNumber = val;
                    }
                }
                else {
                    this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
                }
            }
            else {
                this._portNumber = 0;
            }
        }
        else {
            this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
        }
    }
    /**
     * Checks if this port is configured correctly
     */
    IsValidPort() {
        try {
            if (this._cardNumber <= 0 || this._portNumber <= 0) {
                return false;
            }
            if (this._megabas.stackableCards.length <= this._cardNumber - 1) {
                this._megabas.log.warn(`${this._baseObjName}: card number ${this._cardNumber} is not connected`);
                return false;
            }
            if (this._portType == LightingPortTypes.Output) {
                // No more steps for output ports
                return true;
            }
            // If other port type, check wether the port is configured correctly
            const card = this._megabas.stackableCards[this._cardNumber - 1];
            const port = card.inputPorts[this._portNumber - 1];
            switch (this._portType) {
                case LightingPortTypes.Brightness:
                    if (port.portType != inputPort_1.InputPortTypes.Voltage) {
                        this._megabas.log.warn(`${this._baseObjName}: card ${this._cardNumber} input port ${this._portNumber} is not configured as "voltage" but should be`);
                        return false;
                    }
                    break;
                default:
                    if (port.portType != inputPort_1.InputPortTypes.DryContact) {
                        this._megabas.log.warn(`${this._baseObjName}: card ${this._cardNumber} input port ${this._portNumber} is not configured as "DryContact" but should be`);
                        return false;
                    }
                    break;
            }
            return true;
        }
        catch (error) {
            this._megabas.log.error(`${this._baseObjName}: ${error}`);
            return false;
        }
    }
    /**
     * Returns the value of a dry contact
     */
    GetDryContactClosed() {
        if (this._cardNumber <= 0 || this._portNumber <= 0) {
            return false;
        }
        if (this._megabas.stackableCards.length <= this._cardNumber - 1) {
            this._megabas.log.error(`${this._baseObjName}: card number ${this._cardNumber} is not connected`);
            return false;
        }
        if (this._portType == LightingPortTypes.Output) {
            return false;
        }
        const card = this._megabas.stackableCards[this._cardNumber - 1];
        const port = card.inputPorts[this._portNumber - 1];
        const contactClosed = port.valueDryContactClosed;
        this._megabas.log.silly(`${this._baseObjName}: dry contact ${port.objectName} closed: ${contactClosed}`);
        return contactClosed;
    }
    /**
     * Returns the value of a voltage port
     */
    GetVoltageValue() {
        if (this._cardNumber <= 0 || this._portNumber <= 0) {
            return 0;
        }
        if (this._megabas.stackableCards.length <= this._cardNumber - 1) {
            this._megabas.log.error(`${this._baseObjName}: card number ${this._cardNumber} is not connected`);
            return 0;
        }
        if (this._portType == LightingPortTypes.Output) {
            return 0;
        }
        const card = this._megabas.stackableCards[this._cardNumber - 1];
        const port = card.inputPorts[this._portNumber - 1];
        return port.valueVoltage;
    }
    /**
     * Sets the voltage at an output port
     */
    SetVoltageValue(voltage) {
        if (this._cardNumber <= 0 || this._portNumber <= 0) {
            return;
        }
        if (this._megabas.stackableCards.length <= this._cardNumber - 1) {
            this._megabas.log.error(`${this._baseObjName}: card number ${this._cardNumber} is not connected`);
            return;
        }
        if (this._portType != LightingPortTypes.Output) {
            this._megabas.log.error(`${this._baseObjName}: port type is not an output type`);
            return;
        }
        const card = this._megabas.stackableCards[this._cardNumber - 1];
        const port = card.dacOutputPorts[this._portNumber - 1];
        // For good responsibility: set directly and then inform ioBroker
        port.UpdateValue(voltage);
        this._megabas.setStateAsync(port.objectName + ".voltage", voltage, true);
    }
}
exports.PortLink = PortLink;
