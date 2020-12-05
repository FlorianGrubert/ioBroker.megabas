"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightingDevice = void 0;
class LightingDevice {
    constructor(megabas, id, name) {
        this.megabas = megabas;
        this.id = id;
        this.name = name;
        this.baseObjName = "lightingDevice:" + id;
    }
    async InitializeIoBrokerObjects() {
        await this.megabas.setObjectNotExistsAsync(this.baseObjName, {
            type: "device",
            common: {
                name: this.name,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".presence_voltage", {
            type: "state",
            common: {
                name: "Voltage to set when presence was detected in Millivolt",
                type: "number",
                role: "level",
                min: 0,
                max: 10000,
                def: 10000,
                read: true,
                write: true,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".switch_voltage", {
            type: "state",
            common: {
                name: "Voltage to set when the switch is set to ON in Millivolt",
                type: "number",
                role: "level",
                min: 0,
                max: 10000,
                def: 10000,
                read: true,
                write: true,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".presence_lastSeen", {
            type: "state",
            common: {
                name: "Date and time presences was detected last",
                type: "string",
                role: "date",
                read: true,
                write: false,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".presence_keepaliveSeconds", {
            type: "state",
            common: {
                name: "The number of seconds to keep the light switched on when presence was detected",
                type: "number",
                role: "value.interval",
                read: true,
                write: true,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".presence_isDetected", {
            type: "state",
            common: {
                name: "If presence was detected within the presence keepalive seconds time ",
                type: "boolean",
                role: "sensor.motion",
                read: true,
                write: false,
            },
            native: {},
        });
        await this.megabas.setObjectNotExistsAsync(this.baseObjName + ".switch_isOn", {
            type: "state",
            common: {
                name: "If the switch is switched on",
                type: "boolean",
                role: "switch.light",
                read: true,
                write: false,
            },
            native: {},
        });
    }
}
exports.LightingDevice = LightingDevice;
