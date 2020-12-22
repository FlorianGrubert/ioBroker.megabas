import { InputPortTypes } from "./inputPort";
import { LightingDevice } from "./lightingDevice";
import { Megabas } from "./main";

enum LightingPortTypes {
	"Output" = "output",
	"Presence" = "presence",
	"Switch" = "switch",
	"Brightness" = "brightness",
}

/**
 * Class that defines the link to a port (input or output)
 */
class PortLink {
	/**
	 * The number of the stackable card the port is attached to [1..8]
	 */
	private _cardNumber: number;
	/**
	 * The number of the stackable card the port is attached to [1..8]
	 */
	public get cardNumber(): number {
		return this._cardNumber;
	}
	/**
	 * The number of the stackable card the port is attached to [1..8]
	 */
	public set cardNumber(value: number) {
		this._cardNumber = value;
	}

	/**
	 * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
	 */
	private _portNumber: number;
	/**
	 * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
	 */
	public get portNumber(): number {
		return this._portNumber;
	}
	/**
	 * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
	 */
	public set portNumber(value: number) {
		this._portNumber = value;
	}

	/**
	 * The lighting device this port is connected to
	 */
	private _lightingDevice: LightingDevice;
	/**
	 * The internal ID of this port
	 */
	private _id: string;
	/**
	 * The type of the port
	 */
	private _portType: LightingPortTypes;
	/**
	 * The megabas this port is connected to
	 */
	private _megabas: Megabas;
	// the base name of the object in ioBroker
	private _baseObjName: string;

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	/**
	 * Creates a new port link
	 * @param megabas The megabas controller
	 * @param lightingDevice The lighting device the portlink is assigned to
	 * @param portType The type of the port
	 * @param id The id of the port
	 */
	public constructor(megabas: Megabas, lightingDevice: LightingDevice, portType: LightingPortTypes, id: string) {
		this._lightingDevice = lightingDevice;
		this._id = id;
		this._cardNumber = 0;
		this._portNumber = 0;
		this._portType = portType;
		this._baseObjName = lightingDevice.objectName + "." + portType.toString() + "Ports:" + id;
		this._megabas = megabas;
	}

	/**
	 * Initializes the states in the ioBroker object model
	 */
	public async InitializeIoBrokerObjects(): Promise<void> {
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
	public DeleteIoBrokerObjects(): void {
		this._megabas.delObjectAsync(this._baseObjName + ".cardNumber");
		this._megabas.delObjectAsync(this._baseObjName + ".portNumber");
		this._megabas.delObjectAsync(this._baseObjName);
	}

	/**
	 * Reads the content of the state from ioBroker
	 * @param stateName Name of the state to read
	 * @param defaultValue Default values to set if the state was not set
	 */
	private SynchronizeState(stateName: string, defaultValue: any): void {
		this._megabas.getState(this._baseObjName + "." + stateName, (err, state) => {
			if (err) {
				this._megabas.log.error(`${this._baseObjName}: State "${stateName}" not found: ${err}`);
			}
			if (state) {
				this.SetState(this._baseObjName + "." + stateName, stateName, state.val);
			} else {
				this.SetState(this._baseObjName + "." + stateName, stateName, defaultValue);
			}
		});
	}

	/**
	 * Subscribes the relevant properties to changes from ioBroker
	 */
	public SubscribeStates(): void {
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
	public SetState(
		fullId: string,
		state: string,
		val: string | number | boolean | any[] | Record<string, any> | null,
	): void {
		if (state === "cardNumber") {
			if (val) {
				if (typeof val === "number") {
					if (val < 0 || val > 8) {
						this._megabas.log.error(`${fullId}: ${val} is an invalid index for a stackable card. Setting card number to 0`);
						this._cardNumber = 0;
						this._megabas.setStateAsync(this._baseObjName + ".cardNumber", 0);
					} else {
						this._cardNumber = val;
					}
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._cardNumber = 0;
			}
		} else if (state === "portNumber") {
			if (val) {
				if (typeof val === "number") {
					let maxIdx = 8;
					if (this._portType == LightingPortTypes.Output) {
						maxIdx = 4;
					}

					if (val < 0 || val > maxIdx) {
						this._megabas.log.error(`${fullId}: ${val} is an invalid index for ${this._portType}. Setting port number to 0`);
						this._portNumber = 0;
						this._megabas.setStateAsync(this._baseObjName + ".portNumber", 0);
					} else {
						this._portNumber = val;
					}
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._portNumber = 0;
			}
		} else {
			this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
		}
	}

	/**
	 * Checks if this port is configured correctly
	 */
	public IsValidPort(): boolean {
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
					if (port.portType != InputPortTypes.Voltage) {
						this._megabas.log.warn(`${this._baseObjName}: card ${this._cardNumber} input port ${this._portNumber} is not configured as "voltage" but should be`);
						return false;
					}
					break;
				default:
					if (port.portType != InputPortTypes.DryContact) {
						this._megabas.log.warn(`${this._baseObjName}: card ${this._cardNumber} input port ${this._portNumber} is not configured as "DryContact" but should be`);
						return false;
					}
					break;
			}

			return true;
		} catch (error) {
			this._megabas.log.error(`${this._baseObjName}: ${error}`);
			return false;
		}
	}

	/**
	 * Returns the value of a dry contact
	 */
	public GetDryContactClosed(): boolean {
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
	public GetVoltageValue(): number {
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
	public SetVoltageValue(voltage: number): void {
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
		this._megabas.setStateAsync(port.objectName + ".voltage", voltage);
	}
}

export { PortLink, LightingPortTypes };
