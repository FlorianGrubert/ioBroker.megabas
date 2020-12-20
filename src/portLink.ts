import { LightingDevice } from "./lightingDevice";
import { Megabas } from "./main";

enum LightingPortTypes {
	"Output" = "Output Port",
	"Presence" = "Input for presence signal",
	"Switch" = "Input for a switch",
	"Brightness" = "Input for a brightness signal",
}

/**
 * Class that defines the link to a port (input or output)
 */
class PortLink {
	/**
	 * The number of the sackable card the port is attached to [1..8]
	 */
	private _cardNumber: number;
	/**
	 * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
	 */
	private _portNumber: number;
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
	}
}

export { PortLink, LightingPortTypes };
