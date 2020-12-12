import * as I2C from "i2c-bus";
import { DacOutputPort } from "./dacOutputPort";
import { InputPort } from "./inputPort";
import { Megabas } from "./main";
import { MegabasConstants } from "./megabasConstants";

/**
 * Defines one stackable building automation card
 */
class StackableCard {
	/**
	 * Megabas controller to use
	 */
	private _megabas: Megabas;
	/**
	 * Unique id of the card
	 */
	private _id: string;
	/**
	 * defines the stack level
	 */
	private _stackLevel: number;
	/**
	 * The base name of the object in ioBroker
	 */
	private _baseObjName: string;
	/**
	 * The input ports in this card
	 */
	private _inputPorts: Array<InputPort>;
	/**
	 * The analog output ports in this card
	 */
	private _dacOutputPorts: Array<DacOutputPort>;

	/**
	 * Returns the input ports
	 */
	public get inputPorts(): Array<InputPort> {
		return this._inputPorts;
	}

	/**
	 * Returns the analog output ports
	 */
	public get dacOutputPorts(): Array<DacOutputPort> {
		return this._dacOutputPorts;
	}

	/**
	 * Returns base address of this card in the I2C bus
	 */
	public get hwBaseAddress(): number {
		return MegabasConstants.HW_ADD + this._stackLevel;
	}

	/**
	 * Returns the name of the device object in ioBroker
	 */
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, id: number) {
		this._megabas = megabas;
		this._id = id.toString();
		this._stackLevel = id;
		this._baseObjName = "stackableCard:" + id;
		this._inputPorts = new Array<InputPort>(8);
		this._dacOutputPorts = new Array<DacOutputPort>(8);
	}

	/**
	 * Initializes the states in the ioBroker object model
	 */
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
			const port = new DacOutputPort(this._megabas, this, i);
			port.InitializeOutputPort();
			this._dacOutputPorts[i] = port;
		}
	}

	/**
	 * Subscribes the necessary properties for updates from ioBroker
	 */
	public SubscribeStates(): void {
		this._inputPorts.forEach((port) => {
			port.SubscribeStates();
		});

		this._dacOutputPorts.forEach((port) => {
			port.SubscribeStates();
		});
	}

	/**
	 * Reads the current status from the Megabas
	 * @param i2cBus The I2C bus to read the the data from
	 */
	public UpdateI2c(i2cBus: I2C.I2CBus): void {
		this._megabas.log.silly("Reading i2c status");

		const dryContactStatus = i2cBus.readByteSync(this.hwBaseAddress, MegabasConstants.DRY_CONTACT_VAL_ADD);
		let mask = 1;
		let contactClosed = false;
		for (let i = 0; i < 8; i++) {
			mask = 1 << i;
			contactClosed = (dryContactStatus & mask) > 0;
			this._megabas.log.silly(`${this._baseObjName} contact ${i}: ${contactClosed}`);
			this._inputPorts[i].UpdateValue(contactClosed, i2cBus);
		}
	}
}

export { StackableCard };
