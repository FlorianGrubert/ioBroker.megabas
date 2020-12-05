import { Megabas } from "./main";
import { StackableCard } from "./stackableCard";

enum InputPortTypes {
	"NotSet" = "Not set",
	"1k" = "1k resistor input",
	"10k" = "10k resistor input",
	"Voltage" = "0-10 Volt input",
	"DryContact" = "Dry contact (open or closed)",
	"Counter" = "Counter based contact",
}

class InputPort {
	// Megabas controller to use
	private megabas: Megabas;
	// The card this input port is attached to
	private card: StackableCard;
	// Unique number of the inputPort
	private portNumber: number;
	// The base name of the object in ioBroker
	private baseObjName: string;
	// Defines the type of the input port
	private portType: InputPortTypes;

	public constructor(megabas: Megabas, card: StackableCard, portNumber: number) {
		this.megabas = megabas;
		this.card = card;
		this.portNumber = portNumber;
		this.baseObjName = this.card.getObjectName() + ".inputPort:" + portNumber.toString();
		this.portType = InputPortTypes.NotSet;
	}

	// Initializes the input ports and creates it in the iobroker object model
	public async InitializeInputPort(): Promise<void> {
		const channelBaseName = this.baseObjName;
		await this.megabas.setObjectNotExistsAsync(channelBaseName, {
			type: "channel",
			common: {
				name: "Input port number " + (this.portNumber + 1).toString(),
			},
			native: {},
		});

		await this.megabas.setObjectNotExistsAsync(channelBaseName + ".type", {
			type: "state",
			common: {
				name: "The type of the input port",
				type: "string",
				states: {
					NotSet: "Not set",
					"1k": "1k resistor input",
					"10k": "10k resistor input",
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

		this.megabas.getState(channelBaseName + ".type", (err, state) => {
			if (state && state.val) {
				this.megabas.log.info(`state of ${channelBaseName}.type is ${state.val}`);
			}
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

	public SubscribeStates(): void {
		this.megabas.subscribeStates(this.baseObjName + ".type");
	}
}

export { InputPort };
