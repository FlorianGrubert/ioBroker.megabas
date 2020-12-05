import { InputPort } from "./inputPort";
import { Megabas } from "./main";

class StackableCard {
	// Megabas controller to use
	private megabas: Megabas;
	// Unique id of the card
	private id: string;
	// The base name of the object in ioBroker
	private baseObjName: string;
	// The input ports in this card
	private inputPorts: Array<InputPort>;

	public constructor(megabas: Megabas, id: number) {
		this.megabas = megabas;
		this.id = id.toString();
		this.baseObjName = "stackableCard:" + id;
		this.inputPorts = new Array<InputPort>(8);
	}

	public async InitializeIoBrokerObjects(): Promise<void> {
		await this.megabas.setObjectNotExistsAsync(this.baseObjName, {
			type: "device",
			common: {
				name: "Stackable card level " + this.id,
			},
			native: {},
		});

		for (let i = 0; i < 8; i++) {
			const port = new InputPort(this.megabas, this, i);
			port.InitializeInputPort();
			this.inputPorts[i] = port;
		}

		for (let i = 0; i < 4; i++) {
			this.InitializeDacOutputPort(i);
		}
	}

	// Returns the name of the device object in ioBroker
	public getObjectName(): string {
		return this.baseObjName;
	}

	// Subscribes the necessary properties for updates from ioBroker
	public SubscribeStates(): void {
		for (let i = 0; i < 8; i++) {
			this.inputPorts[i].SubscribeStates();
		}
	}

	// Initializes the DAC output ports in the object model from ioBroker
	private async InitializeDacOutputPort(portId: number): Promise<void> {
		const channelBaseName = this.baseObjName + ".dacOutputPort:" + portId.toString();
		await this.megabas.setObjectNotExistsAsync(channelBaseName, {
			type: "channel",
			common: {
				name: "DAC output port number " + (portId + 1).toString(),
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
