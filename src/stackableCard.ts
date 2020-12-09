import { InputPort } from "./inputPort";
import { Megabas } from "./main";

class StackableCard {
	// Megabas controller to use
	private _megabas: Megabas;
	// Unique id of the card
	private _id: string;
	// The base name of the object in ioBroker
	private _baseObjName: string;
	// The input ports in this card
	private _inputPorts: Array<InputPort>;

	public get inputPorts(): Array<InputPort> {
		return this._inputPorts;
	}

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, id: number) {
		this._megabas = megabas;
		this._id = id.toString();
		this._baseObjName = "stackableCard:" + id;
		this._inputPorts = new Array<InputPort>(8);
	}

	public async InitializeIoBrokerObjects(): Promise<void> {
		await this._megabas.setObjectNotExistsAsync(this._baseObjName, {
			type: "device",
			common: {
				name: "Stackable card level " + this._id,
			},
			native: {},
		});

		for (let i = 0; i < 8; i++) {
			const port = new InputPort(this._megabas, this, i);
			port.InitializeInputPort();
			this._inputPorts[i] = port;
		}

		for (let i = 0; i < 4; i++) {
			this.InitializeDacOutputPort(i);
		}
	}

	// Subscribes the necessary properties for updates from ioBroker
	public SubscribeStates(): void {
		for (let i = 0; i < 8; i++) {
			this._inputPorts[i].SubscribeStates();
		}
	}

	// Initializes the DAC output ports in the object model from ioBroker
	private async InitializeDacOutputPort(portId: number): Promise<void> {
		const channelBaseName = this._baseObjName + ".dacOutputPort:" + portId.toString();
		await this._megabas.setObjectNotExistsAsync(channelBaseName, {
			type: "channel",
			common: {
				name: "DAC output port number " + (portId + 1).toString(),
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(channelBaseName + ".voltage", {
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
