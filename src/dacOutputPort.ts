import * as I2C from "i2c-bus";
import { Megabas } from "./main";
import { MegabasConstants } from "./megabasConstants";
import { StackableCard } from "./stackableCard";

/**
 * Defines an analog output port
 */
class DacOutputPort {
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
	 * The current voltage applied to the output port
	 */
	private _currentVoltage: number;

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, card: StackableCard, portNumber: number) {
		this._megabas = megabas;
		this._card = card;
		this._portNumber = portNumber;
		this._baseObjName = this._card.objectName + ".dacOutputPort:" + portNumber.toString();
		this._currentVoltage = 0;
	}

	/**
	 * Initializes the states in the ioBroker object model
	 */
	public async InitializeOutputPort(): Promise<void> {
		const channelBaseName = this._baseObjName;
		await this._megabas.setObjectNotExistsAsync(channelBaseName, {
			type: "channel",
			common: {
				name: "DAC output port number " + (this._portNumber + 1).toString(),
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

	/**
	 * Subscribes the relevant properties to changes from ioBroker
	 */
	public SubscribeStates(): void {
		this._megabas.subscribeStates(this._baseObjName + ".voltage");
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
		if (state === "voltage") {
			if (val && typeof val === "number") {
				this.UpdateValue(val);
			} else {
				this.UpdateValue(0);
			}
		}
	}

	/**
	 * Sets the new value on the output port on the card
	 * @param newValue The new value to write to the output port
	 */
	public UpdateValue(newValue: number): void {
		if (newValue != this._currentVoltage) {
			if (newValue < 0) {
				this._megabas.log.warn(`${this._baseObjName}: Value ${newValue} is not valid. Setting value to 0`);
				newValue = 0;
			}
			if (newValue > 10000) {
				this._megabas.log.warn(`${this._baseObjName}: Value ${newValue} is not valid. Setting value to 10000`);
				newValue = 10000;
			}
			this._currentVoltage = newValue;

			this._megabas.log.debug(`${this._baseObjName}: Setting output value to ${this._currentVoltage}`);

			const i2cBus = I2C.open(1, (err) => {
				if (err) {
					this._megabas.log.error(`${this._baseObjName}: error connecting to i2c-bus: ${err}`);
					return;
				}

				const hwAddress = MegabasConstants.U0_10_OUT_VAL1_ADD + 2 * this._portNumber;
				i2cBus.writeWord(this._card.hwBaseAddress, hwAddress, this._currentVoltage, (err) => {
					if (err) {
						this._megabas.log.error(
							`${this._baseObjName}: error setting output voltage ${this._currentVoltage}: ${err}`,
						);
					}

					i2cBus.close((err) => {
						if (err) {
							this._megabas.log.error(`${this._baseObjName}: error closing i2c-bus: ${err}`);
						}
					});
				});
			});
		}
	}
}

export { DacOutputPort };
