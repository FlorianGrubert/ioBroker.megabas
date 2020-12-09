"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackableCard = void 0;
const inputPort_1 = require("./inputPort");
class StackableCard {
    constructor(megabas, id) {
        this._megabas = megabas;
        this._id = id.toString();
        this._baseObjName = "stackableCard:" + id;
        this._inputPorts = new Array(8);
    }
    get inputPorts() {
        return this._inputPorts;
    }
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
            this.InitializeDacOutputPort(i);
        }
    }
    // Returns the name of the device object in ioBroker
    get objectName() {
        return this._baseObjName;
    }
    // Subscribes the necessary properties for updates from ioBroker
    SubscribeStates() {
        for (let i = 0; i < 8; i++) {
            this._inputPorts[i].SubscribeStates();
        }
    }
    // Initializes the DAC output ports in the object model from ioBroker
    async InitializeDacOutputPort(portId) {
        const channelBaseName = this._baseObjName + ".dacOutputPort:" + portId.toString();
        await this._megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "DAC output port number " + (portId + 1).toString(),
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
}
exports.StackableCard = StackableCard;
