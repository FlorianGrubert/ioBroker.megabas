/*
 * Created with @iobroker/create-adapter v1.30.1
 */
import * as utils from "@iobroker/adapter-core";
import * as I2C from "i2c-bus";
import { LightingDevice } from "./lightingDevice";
import { StackableCard } from "./stackableCard";

/**
 * Megabas base controller
 */
class Megabas extends utils.Adapter {
	private _lightingDevices: Array<LightingDevice>;
	private _stackableCards: Array<StackableCard>;
	/**
	 * The available stackable cards
	 */
	public get stackableCards(): Array<StackableCard> {
		return this._stackableCards;
	}
	private _isRunning: boolean;
	private _intervalI2cbus: NodeJS.Timeout | null;
	private _timeoutWatchdog: NodeJS.Timeout | null;
	private _lastI2cCheck: number;

	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "megabas",
		});

		this._isRunning = false;
		this._intervalI2cbus = null;
		this._timeoutWatchdog = null;
		this._lastI2cCheck = Date.now();
		this._lightingDevices = new Array<LightingDevice>(0);
		this._stackableCards = new Array<StackableCard>(0);

		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
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
		if (maxStackLevel > 8) {
			maxStackLevel = 8;
		}

		this._stackableCards = new Array<StackableCard>(maxStackLevel);
		for (let i = 0; i < maxStackLevel; i++) {
			const card = new StackableCard(this, i);
			card.InitializeIoBrokerObjects();
			this._stackableCards[i] = card;
		}

		// Define the lighting devices to display in the channel list
		const lightingDevices = new Array<string>(0);
		const splitDevices = this.config.LightingDevices.split(";");
		splitDevices.forEach((dev) => {
			lightingDevices.push(dev.trim());
		});

		this._lightingDevices = new Array<LightingDevice>(lightingDevices.length);
		// Configure the lighting devices by creating them in the system
		for (let i = 0; i < lightingDevices.length; i++) {
			const device = new LightingDevice(this, i.toString(), lightingDevices[i]);
			await device.InitializeIoBrokerObjects();
			this._lightingDevices[i] = device;
		}

		// Subscribe to object updates for the stackable cards
		this._stackableCards.forEach((card) => {
			card.SubscribeStates();
		});

		// Subscribe to object updates for the lighting devices
		this._lightingDevices.forEach((device) => {
			device.SubscribeStates();
		});

		// start the actual adapter
		this._isRunning = true;
		this.setState("info.connection", true, true);

		this.log.info(`${this.name} Initializing polling with ${this.config.PollingInterval}ms`);
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const that = this;
		this._intervalI2cbus = setInterval(() => {
			this.UpdateI2c(that);
		}, this.config.PollingInterval);

		// Enable an independent watchdog
		this._timeoutWatchdog = setTimeout(() => {
			this.WatchDog(that);
		}, this.config.PollingInterval * 5);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.setState("info.connection", false, true);
			this._isRunning = false;

			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...

			if (this.log) {
				this.log.debug(`Unloading intervalI2cbus: ${this._intervalI2cbus}`);
			}
			if (this._intervalI2cbus) {
				clearInterval(this._intervalI2cbus);
			}

			if (this.log) {
				this.log.debug(`Unloading watchdog: ${this._timeoutWatchdog}`);
			}
			if (this._timeoutWatchdog) {
				clearTimeout(this._timeoutWatchdog);
			}

			callback();
		} catch (e) {
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
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
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
					selectedPort.SetState(id, splitId[4], state?.val);
				} else {
					selectedPort.SetState(id, splitId[4], null);
				}
			} else if (splitId[3].startsWith("dacOutputPort")) {
				const portSplit = splitId[3].split(":", 2);
				const portIndex = Number(portSplit[1]);
				const selectedPort = selectedCard.dacOutputPorts[portIndex];
				if (state) {
					selectedPort.SetState(id, splitId[4], state?.val);
				} else {
					selectedPort.SetState(id, splitId[4], null);
				}
			} else {
				this.log.error(
					`${id}: Unknown property in state changed for stackable card ${selectedCard.objectName}`,
				);
			}
		} else if (splitId[2].startsWith("lightingDevice")) {
			const deviceSplit = splitId[2].split(":", 2);
			const deviceIndex = Number(deviceSplit[1]);
			const lightingDevice = this._lightingDevices[deviceIndex];
			if (splitId.length < 4) {
				this.log.error(`${id}: Invalid state changed for lightingDevice ${lightingDevice.objectName}`);
				return;
			}
			let splitId4 = null;
			if (splitId.length > 4) {
				splitId4 = splitId[4];
			}

			if (state) {
				lightingDevice.SetState(id, splitId[3], splitId4, state?.val);
			} else {
				lightingDevice.SetState(id, splitId[3], splitId4, null);
			}
		} else {
			this.log.error(`${id}: Unknown property state changed`);
			return;
		}

		if (state) {
			// The state was changed
			this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.debug(`state ${id} deleted`);
		}
	}

	/**
	 * Reads the status of all components from the I2C bus
	 * @param megabas The megabas controller to use
	 */
	private UpdateI2c(megabas: Megabas): void {
		if (!megabas._isRunning) {
			if (megabas.log) {
				megabas.log.silly("Adapter is not running");
			}
			return;
		}
		megabas.log.silly("Connection to i2c bus");
		this._lastI2cCheck = Date.now();

		try {
			const i2cBus = I2C.open(1, (err) => {
				if (err) {
					megabas.log.error(`${megabas.name}: error connecting to i2c-bus: ${err}`);
					return;
				}

				megabas._stackableCards.forEach((card) => {
					card.UpdateI2c(i2cBus);
				});
				i2cBus.close((err) => {
					if (err) {
						megabas.log.error(`${megabas.name}: error closing i2c-bus: ${err}`);
					}
				});
			});

			// Update the lighting devices
			megabas._lightingDevices.forEach((device) => { device.UpdateDeviceStatus(); });
		} catch (error) {
			megabas.log.error(`${megabas.name}: Error updating I2C status: ${error}`);
		}
	}

	/**
	 * Checks wether the checks were performed as necessary and else restarts the i2c check interval
	 * @param megabas The megabas instance to watch for
	 */
	private WatchDog(megabas: Megabas): void {
		const timeInMSec = Date.now() - megabas._lastI2cCheck;

		if (megabas._isRunning && timeInMSec > megabas.config.PollingInterval * 2) {
			if (megabas.log) {
				megabas.log.warn(
					`${this.name} Watchdog-warning: Interval not checking since ${timeInMSec}ms. Reinitializing polling.`,
				);
			}
			if (megabas._intervalI2cbus) {
				clearInterval(megabas._intervalI2cbus);
			}
			megabas._intervalI2cbus = setInterval(() => {
				megabas.UpdateI2c(megabas);
			}, megabas.config.PollingInterval);
		}

		megabas._timeoutWatchdog = setTimeout(() => {
			megabas.WatchDog(megabas);
		}, megabas.config.PollingInterval * 5);
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.message" property to be set to true in io-package.json
	//  */
	// private onMessage(obj: ioBroker.Message): void {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }
}

if (module.parent) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Megabas(options);
} else {
	// otherwise start the instance directly
	(() => new Megabas())();
}

export { Megabas };
