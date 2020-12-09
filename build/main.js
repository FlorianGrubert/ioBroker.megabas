"use strict";
/*
 * Created with @iobroker/create-adapter v1.30.1
 */
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
exports.Megabas = void 0;
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
const lightingDevice_1 = require("./lightingDevice");
const stackableCard_1 = require("./stackableCard");
class Megabas extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "megabas",
        });
        this._lightingDevices = new Array(0);
        this._stackableCards = new Array(0);
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // Reset the connection indicator during startup
        this.setState("info.connection", false, true);
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("config MaxStackLevel: " + this.config.MaxStackLevel);
        this.log.info("config LightingDevices: " + this.config.LightingDevices);
        // validate the maxStackLevel and set to valid values instead
        let maxStackLevel = this.config.MaxStackLevel;
        if (!maxStackLevel || maxStackLevel <= 0) {
            maxStackLevel = 1;
        }
        if (maxStackLevel > 4) {
            maxStackLevel = 4;
        }
        this._stackableCards = new Array(maxStackLevel);
        for (let i = 0; i < maxStackLevel; i++) {
            const card = new stackableCard_1.StackableCard(this, i);
            card.InitializeIoBrokerObjects();
            this._stackableCards[i] = card;
        }
        // Define the lighting devices to display in the channel list
        const lightingDevices = new Array(0);
        const splitDevices = this.config.LightingDevices.split(";");
        splitDevices.forEach((dev) => {
            lightingDevices.push(dev.trim());
        });
        this._lightingDevices = new Array(lightingDevices.length);
        // Configure the lighting devices by creating them in the system
        for (let i = 0; i < lightingDevices.length; i++) {
            const device = new lightingDevice_1.LightingDevice(this, i.toString(), lightingDevices[i]);
            await device.InitializeIoBrokerObjects();
            this._lightingDevices[i] = device;
        }
        // Debug: original test variable
        await this.setObjectNotExistsAsync("testVariable", {
            type: "state",
            common: {
                name: "testVariable",
                type: "boolean",
                role: "indicator",
                read: true,
                write: true,
            },
            native: {},
        });
        // Subscribe to object updates for the stackable cards
        this._stackableCards.forEach((card) => {
            card.SubscribeStates();
        });
        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        this.subscribeStates("testVariable");
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates("lights.*");
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates("*");
        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        await this.setStateAsync("testVariable", true);
        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        await this.setStateAsync("testVariable", { val: true, ack: true });
        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });
        // examples for the checkPassword/checkGroup functions
        let result = await this.checkPasswordAsync("admin", "iobroker");
        this.log.info("check user admin pw iobroker: " + result);
        result = await this.checkGroupAsync("admin", "admin");
        this.log.info("check group user admin group admin: " + result);
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    // 	if (obj) {
    // 		// The object was changed
    // 		this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    // 	} else {
    // 		// The object was deleted
    // 		this.log.info(`object ${id} deleted`);
    // 	}
    // }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        // common name format: megabas.0.stackableCard:0.inputPort:0.type
        // splitId[0] = megabas
        // splitId[1] = 0 -> Instance ID
        // splitId[2] = stackableCard:0
        // splitId[3] = inputPort:0
        // splitId[4] = type
        const splitId = id.split(".");
        if (splitId.length <= 3) {
            this.log.error(`${id}: Invalid state changed received`);
            return;
        }
        if (splitId[2].startsWith("stackableCard")) {
            const cardSplit = splitId[2].split(":", 2);
            const cardIndex = Number(cardSplit[1]);
            const selectedCard = this._stackableCards[cardIndex];
            if (splitId.length <= 4) {
                this.log.error(`${id}: Invalid state changed for stackable card ${selectedCard.objectName}`);
                return;
            }
            if (splitId[3].startsWith("inputPort")) {
                const portSplit = splitId[3].split(":", 2);
                const portIndex = Number(portSplit[1]);
                const selectedPort = selectedCard.inputPorts[portIndex];
                if (state) {
                    state.ack = selectedPort.SetState(id, splitId[4], state === null || state === void 0 ? void 0 : state.val);
                }
                else {
                    selectedPort.SetState(id, splitId[4], null);
                }
            }
            else {
                this.log.error(`${id}: Unknown property in state changed for stackable card ${selectedCard.objectName}`);
            }
        }
        else {
            this.log.error(`${id}: Unknown property state changed`);
            return;
        }
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
}
exports.Megabas = Megabas;
if (module.parent) {
    // Export the constructor in compact mode
    module.exports = (options) => new Megabas(options);
}
else {
    // otherwise start the instance directly
    (() => new Megabas())();
}
