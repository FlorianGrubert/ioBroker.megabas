import { Megabas } from "./main";

class StackableCard {
	// Megabas controller to use
	private megabas: Megabas;
	// Unique id of the card
	private id: string;
	// The base name of the object in ioBroker
	private baseObjName: string;

	public constructor(megabas: Megabas, id: number) {
		this.megabas = megabas;
		this.id = id.toString();
		this.baseObjName = "stackableCard:" + id;
	}

	public async InitializeIoBrokerObjects(): Promise<void> {
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

	private async InitializeInputPort(portId: number): Promise<void> {
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

	private async InitializeDacOutputPort(portId: number): Promise<void> {
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

export { StackableCard };
