"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LightingDevice = void 0;
class LightingDevice {
    constructor(megabas, id, name) {
        this._megabas = megabas;
        this._id = id;
        this._name = name;
        this._baseObjName = "lightingDevice:" + id;
    }
    // Returns the name of the device object in ioBroker
    get objectName() {
        return this._baseObjName;
    }
    async InitializeIoBrokerObjects() {
        await this._megabas.setObjectNotExistsAsync(this._baseObjName, {
            type: "device",
            common: {
                name: this._name,
            },
            native: {},
        });
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_voltage", {
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
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switch_voltage", {
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
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".off_voltage", {
            type: "state",
            common: {
                name: "Voltage to set when switch and presence are OFF",
                type: "number",
                role: "level",
                min: 0,
                max: 10000,
                def: 0,
                read: true,
                write: true,
            },
            native: {},
        });
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_lastSeen", {
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
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_keepaliveSeconds", {
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
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_isDetected", {
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
        await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switch_isOn", {
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
