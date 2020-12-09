"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputPort = void 0;
var InputPortTypes;
(function (InputPortTypes) {
    InputPortTypes["NotSet"] = "Not set";
    InputPortTypes["Resistor1k"] = "1k resistor input";
    InputPortTypes["Resistor10k"] = "10k resistor input";
    InputPortTypes["Voltage"] = "0-10 Volt input";
    InputPortTypes["DryContact"] = "Dry contact (open or closed)";
    InputPortTypes["Counter"] = "Counter based contact";
})(InputPortTypes || (InputPortTypes = {}));
class InputPort {
    constructor(megabas, card, portNumber) {
        this._megabas = megabas;
        this._card = card;
        this._portNumber = portNumber;
        this._baseObjName = this._card.objectName + ".inputPort:" + portNumber.toString();
        this.portType = InputPortTypes.NotSet;
    }
    // Returns the name of the device object in ioBroker
    get objectName() {
        return this._baseObjName;
    }
    // Initializes the input ports and creates it in the iobroker object model
    async InitializeInputPort() {
        const channelBaseName = this._baseObjName;
        await this._megabas.setObjectNotExistsAsync(channelBaseName, {
            type: "channel",
            common: {
                name: "Input port number " + (this._portNumber + 1).toString(),
            },
            native: {},
        });
        await this._megabas.setObjectNotExistsAsync(channelBaseName + ".type", {
            type: "state",
            common: {
                name: "The type of the input port",
                type: "string",
                states: {
                    NotSet: "Not set",
                    Resistor1k: "1k resistor input",
                    Resistor10k: "10k resistor input",
                    Voltage: "0-10 Volt input",
                    DryContact: "Dry contact (open or closed)",
                    Counter: "Counter based contact",
                },
                def: "NotSet",
                role: "common.states",
                read: true,
                write: true,
            },
            native: {},
        });
        // Synchronize the state now
        this._megabas.getState(channelBaseName + ".type", (err, state) => {
            if (state) {
                this.SetState(channelBaseName + ".type", "type", state.val);
            }
            else {
                this._megabas.log.error(`${channelBaseName}: State "type" not found`);
            }
        });
        await this._megabas.setObjectNotExistsAsync(channelBaseName + ".voltage", {
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
        await this._megabas.setObjectNotExistsAsync(channelBaseName + ".dryContactClosed", {
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
        await this._megabas.setObjectNotExistsAsync(channelBaseName + ".resistorValue", {
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
    SubscribeStates() {
        this._megabas.subscribeStates(this._baseObjName + ".type");
    }
    SetState(fullId, state, val) {
        if (state === "type") {
            if (val) {
                if (val == "Counter") {
                    this.portType = InputPortTypes.Counter;
                    this._megabas.log.info(`${fullId}: Setting ${state} to Counter`);
                }
                else if (val == "DryContact") {
                    this.portType = InputPortTypes.DryContact;
                    this._megabas.log.info(`${fullId}: Setting ${state} to DryContact`);
                }
                else if (val == "NotSet") {
                    this.portType = InputPortTypes.NotSet;
                    this._megabas.log.info(`${fullId}: Setting ${state} to NotSet`);
                }
                else if (val == "Resistor1k") {
                    this.portType = InputPortTypes.Resistor1k;
                    this._megabas.log.info(`${fullId}: Setting ${state} to Resistor1k`);
                }
                else if (val == "Resistor10k") {
                    this.portType = InputPortTypes.Resistor10k;
                    this._megabas.log.info(`${fullId}: Setting ${state} to Resistor10k`);
                }
                else if (val == "Voltage") {
                    this.portType = InputPortTypes.Voltage;
                    this._megabas.log.info(`${fullId}: Setting ${state} to Voltage`);
                }
                else {
                    this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) in setting ${state} not found`);
                }
            }
            else {
                this.portType = InputPortTypes.NotSet;
            }
        }
        else {
            this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
        }
    }
}
exports.InputPort = InputPort;
