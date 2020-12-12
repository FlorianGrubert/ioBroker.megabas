import * as I2C from "i2c-bus";
import { Megabas } from "./main";
import { MegabasConstants } from "./megabasConstants";
import { StackableCard } from "./stackableCard";

enum InputPortTypes {
	"NotSet" = "Not set",
	"Resistor1k" = "1k resistor input",
	"Resistor10k" = "10k resistor input",
	"Voltage" = "0-10 Volt input",
	"DryContact" = "Dry contact (open or closed)",
	"Counter" = "Counter based contact",
}

/**
 * Defines an input port on a stackable card
 */
class InputPort {
	/**
	 * Megabas controller to use
	 */
	private _megabas: Megabas;
	/**
	 * The card this input port is attached to
	 */
	private _card: StackableCard;
	/**
	 * Unique number of the inputPort
	 */
	private _portNumber: number;
	/**
	 * The base name of the object in ioBroker
	 */
	private _baseObjName: string;
	/**
	 * Defines the type of the input port
	 */
	private _portType: InputPortTypes;
	/**
	 * If the dry contact is closed
	 */
	private _valueDryContactClosed: boolean;
	/**
	 * The voltage detected in the input port
	 */
	private _valueVoltage: number;

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	/**
	 * Returns the type of the port
	 */
	public get portType(): InputPortTypes {
		return this._portType;
	}

	public constructor(megabas: Megabas, card: StackableCard, portNumber: number) {
		this._megabas = megabas;
		this._card = card;
		this._portNumber = portNumber;
		this._baseObjName = this._card.objectName + ".inputPort:" + portNumber.toString();
		this._portType = InputPortTypes.NotSet;
		this._valueDryContactClosed = false;
		this._valueVoltage = 0;
	}

	/**
	 * Initializes the states in the ioBroker object model
	 */
	public async InitializeInputPort(): Promise<void> {
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
			} else {
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

		// Synchronize the state now
		this._megabas.getState(channelBaseName + ".voltage", (err, state) => {
			if (err) {
				this._megabas.log.error(`${channelBaseName}: State "voltage" not found: ${err}`);
			}
			if (state) {
				this.SetState(channelBaseName + ".voltage", "voltage", state.val);
			} else {
				this.SetState(channelBaseName + ".voltage", "voltage", 0);
			}
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

		// Synchronize the state now
		this._megabas.getState(channelBaseName + ".dryContactClosed", (err, state) => {
			if (err) {
				this._megabas.log.error(`${channelBaseName}: State "dryContactClosed" not found: ${err}`);
			}
			if (state) {
				this.SetState(channelBaseName + ".dryContactClosed", "dryContactClosed", state.val);
			} else if (err) {
				this.SetState(channelBaseName + ".dryContactClosed", "dryContactClosed", false);
			}
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

	/**
	 * Subscribes the relevant properties to changes from ioBroker
	 */
	public SubscribeStates(): void {
		this._megabas.subscribeStates(this._baseObjName + ".type");
	}

	/**
	 * State update from ioBroker received: Process it and update the internal variables
	 * @param fullId The full name of the state to update including path
	 * @param state The name of the state to update
	 * @param val The value to set
	 */
	public SetState(
		fullId: string,
		state: string,
		val: string | number | boolean | any[] | Record<string, any> | null,
	): void {
		if (state === "type") {
			if (val) {
				if (val == "Counter") {
					this._portType = InputPortTypes.Counter;
					this._megabas.log.debug(`${fullId}: Setting ${state} to Counter`);
				} else if (val == "DryContact") {
					this._portType = InputPortTypes.DryContact;
					this._megabas.log.debug(`${fullId}: Setting ${state} to DryContact`);
				} else if (val == "NotSet") {
					this._portType = InputPortTypes.NotSet;
					this._megabas.log.debug(`${fullId}: Setting ${state} to NotSet`);
				} else if (val == "Resistor1k") {
					this._portType = InputPortTypes.Resistor1k;
					this._megabas.log.debug(`${fullId}: Setting ${state} to Resistor1k`);
				} else if (val == "Resistor10k") {
					this._portType = InputPortTypes.Resistor10k;
					this._megabas.log.debug(`${fullId}: Setting ${state} to Resistor10k`);
				} else if (val == "Voltage") {
					this._portType = InputPortTypes.Voltage;
					this._megabas.log.debug(`${fullId}: Setting ${state} to Voltage`);
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) in setting ${state} not found`);
				}
			} else {
				this._portType = InputPortTypes.NotSet;
			}
		} else if (state === "dryContactClosed") {
			if (val) {
				if (typeof val === "boolean") {
					this._valueDryContactClosed = val as boolean;
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._valueDryContactClosed = false;
			}
		} else if (state === "voltage") {
			if (val) {
				if (typeof val === "number") {
					this._valueVoltage = val as number;
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._valueVoltage = 0;
			}
		} else {
			this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
		}
	}

	/**
	 * Updates the values of this input port from the I2C bus
	 * @param dryContactStatus The status of the port if it is a dry contact
	 * @param i2cBus The I2C bus used to read status values from
	 */
	public UpdateValue(dryContactStatus: boolean, i2cBus: I2C.I2CBus): void {
		if (this._portType === InputPortTypes.DryContact) {
			if (this._valueDryContactClosed != dryContactStatus) {
				this._valueDryContactClosed = dryContactStatus;
				this._megabas.setStateAsync(this._baseObjName + ".dryContactClosed", this._valueDryContactClosed);
			}
		} else {
			if (this._portType === InputPortTypes.Voltage) {
				const hwAddress = MegabasConstants.U0_10_IN_VAL1_ADD + 2 * this._portNumber;
				const voltage = i2cBus.readWordSync(this._card.hwBaseAddress, hwAddress);
				if (this._valueVoltage != voltage) {
					this._valueVoltage = voltage;
					this._megabas.setStateAsync(this._baseObjName + ".voltage", this._valueVoltage);
				}
			}
		}
	}
}

export { InputPort };
