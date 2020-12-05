"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackableCard = void 0;
class StackableCard {
    constructor(megabas, id) {
        this.megabas = megabas;
        this.id = id.toString();
        this.baseObjName = "stackableCard:" + id;
    }
    async InitializeIoBrokerObjects() {
        await this.megabas.setObjectNotExistsAsync(this.baseObjName, {
            type: "device",
            common: {
                name: "Stackable card level " + this.id,
            },
            native: {},
        });
        for (let i = 1; i <= 8; i++) {
            this.InitializeInputPort(i);
        }
        for (let i = 1; i <= 4; i++) {
            this.InitializeDacOutputPort(i);
        }
    }
    async InitializeInputPort(portId) {
        const channelBaseName = this.baseObjName + ".inputPort:" + portId.toString();
        await this.megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "Input port number " + portId.toString(),
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(channelBaseName + ".type", {
            type: "state",
            common: {
                name: "The type of the input port",
                type: "string",
                states: {
                    "1k": "1k resistor input",
                    "10k": "10k resistor input",
                    Voltage: "0-10 Volt input",
                    DryContact: "Dry contact (open or closed)",
                    Counter: "Counter based contact",
                },
                role: "common.states",
                read: true,
                write: true,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(channelBaseName + ".voltage", {
            type: "state",
            common: {
                name: "The voltage at this input if type is 'Voltage'",
                type: "number",
                role: "level",
                min: 0,
                max: 10000,
                read: true,
                write: false,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(channelBaseName + ".dryContactClosed", {
            type: "state",
            common: {
                name: "If the dry contact is closed or open",
                type: "boolean",
                role: "switch",
                read: true,
                write: false,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(channelBaseName + ".resistorValue", {
            type: "state",
            common: {
                name: "The resistor value in kiloOhms if type is 1k or 10k",
                type: "number",
                role: "level",
                read: true,
                write: false,
            },
            native: {},
        });
    }
    async InitializeDacOutputPort(portId) {
        const channelBaseName = this.baseObjName + ".dacOutputPort:" + portId.toString();
        await this.megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "DAC output port number " + portId.toString(),
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
