import { Megabas } from "./main";
import { StackableCard } from "./stackableCard";

enum InputPortTypes {
	"NotSet" = "Not set",
	"Resistor1k" = "1k resistor input",
	"Resistor10k" = "10k resistor input",
	"Voltage" = "0-10 Volt input",
	"DryContact" = "Dry contact (open or closed)",
	"Counter" = "Counter based contact",
}

class InputPort {
	// Megabas controller to use
	private _megabas: Megabas;
	// The card this input port is attached to
	private _card: StackableCard;
	// Unique number of the inputPort
	private _portNumber: number;
	// The base name of the object in ioBroker
	private _baseObjName: string;
	// Defines the type of the input port
	private portType: InputPortTypes;

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, card: StackableCard, portNumber: number) {
		this._megabas = megabas;
		this._card = card;
		this._portNumber = portNumber;
		this._baseObjName = this._card.objectName + ".inputPort:" + portNumber.toString();
		this.portType = InputPortTypes.NotSet;
	}

	// Initializes the input ports and creates it in the iobroker object model
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

	public SubscribeStates(): void {
		this._megabas.subscribeStates(this._baseObjName + ".type");
	}

	public SetState(
		fullId: string,
		state: string,
		val: string | number | boolean | any[] | Record<string, any> | null,
	): boolean {
		if (state === "type") {
			if (val) {
				if (val === InputPortTypes.Counter) {
					this.portType = InputPortTypes.Counter;
					this._megabas.log.info(`${fullId}: Setting ${state} to Counter`);
				} else if (val === InputPortTypes.DryContact) {
					this.portType = InputPortTypes.DryContact;
					this._megabas.log.info(`${fullId}: Setting ${state} to DryContact`);
				} else if (val === InputPortTypes.NotSet) {
					this.portType = InputPortTypes.NotSet;
					this._megabas.log.info(`${fullId}: Setting ${state} to NotSet`);
				} else if (val === InputPortTypes.Resistor1k) {
					this.portType = InputPortTypes.Resistor1k;
					this._megabas.log.info(`${fullId}: Setting ${state} to Resistor1k`);
				} else if (val === InputPortTypes.Resistor10k) {
					this.portType = InputPortTypes.Resistor10k;
					this._megabas.log.info(`${fullId}: Setting ${state} to Resistor10k`);
				} else if (val === InputPortTypes.Voltage) {
					this.portType = InputPortTypes.Voltage;
					this._megabas.log.info(`${fullId}: Setting ${state} to Voltage`);
				}
			} else {
				this.portType = InputPortTypes.NotSet;
			}
			return true;
		} else {
			this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
			return false;
		}
	}
}

export { InputPort };
