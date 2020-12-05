"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackableCard = void 0;
const inputPort_1 = require("./inputPort");
class StackableCard {
    constructor(megabas, id) {
        this.megabas = megabas;
        this.id = id.toString();
        this.baseObjName = "stackableCard:" + id;
        this.inputPorts = new Array(8);
    }
    async InitializeIoBrokerObjects() {
        await this.megabas.setObjectNotExistsAsync(this.baseObjName, {
            type: "device",
            common: {
                name: "Stackable card level " + this.id,
            },
            native: {},
        });
        for (let i = 0; i < 8; i++) {
            const port = new inputPort_1.InputPort(this.megabas, this, i);
            port.InitializeInputPort();
            this.inputPorts[i] = port;
        }
        for (let i = 0; i < 4; i++) {
            this.InitializeDacOutputPort(i);
        }
    }
    // Returns the name of the device object in ioBroker
    getObjectName() {
        return this.baseObjName;
    }
    // Subscribes the necessary properties for updates from ioBroker
    SubscribeStates() {
        for (let i = 0; i < 8; i++) {
            this.inputPorts[i].SubscribeStates();
        }
    }
    // Initializes the DAC output ports in the object model from ioBroker
    async InitializeDacOutputPort(portId) {
        const channelBaseName = this.baseObjName + ".dacOutputPort:" + portId.toString();
        await this.megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "DAC output port number " + (portId + 1).toString(),
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(channelBaseName + ".voltage", {
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
