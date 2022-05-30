import { Megabas } from "./main";
import { LightingPortTypes, PortLink } from "./portLink";

interface NumberCallback {
	(value: number): void;
}

class LightingDevice {
	// Megabas controller to use
	private _megabas: Megabas;
	// Unique id of the lighting device
	private _id: string;
	// Name of the lighting device
	private _name: string;
	// the base name of the object in ioBroker
	private _baseObjName: string;
	// The output ports to use
	private _outputPorts: Array<PortLink>;
	// The ports for the presence signal
	private _presencePorts: Array<PortLink>;
	// The switch ports to use
	private _switchPorts: Array<PortLink>;
	// The ports for brightness signals
	private _brightnessPorts: Array<PortLink>;
	// The last voltage that was set by the device
	private _lastVoltage: number;

	private _isEnabled: boolean;
	/**
	 * If this lighting device is enabled
	 */
	public get isEnabled(): boolean {
		return this._isEnabled;
	}
	/**
	 * If this lighting device is enabled
	 */
	public set isEnabled(value: boolean) {
		this._isEnabled = value;
	}

	private _presenceDetectionEnabled: boolean;
	/**
	 * If presence detection is enabled
	 */
	public get presenceDetectionEnabled(): boolean {
		return this._presenceDetectionEnabled;
	}
	/**
	 * If presence detection is enabled
	 */
	public set presenceDetectionEnabled(value: boolean) {
		this._presenceDetectionEnabled = value;
	}

	private _presenceVoltage: number;
	/**
	 * The voltage to set if presence is detected
	 */
	public get presenceVoltage(): number {
		return this._presenceVoltage;
	}
	/**
	 * The voltage to set if presence is detected
	 */
	public set presenceVoltage(value: number) {
		this._presenceVoltage = this.ValidateVoltage(value);
	}

	private _switchVoltage: number;
	/**
	 * The voltage to set if the switch is switched on
	 */
	public get switchVoltage(): number {
		return this._switchVoltage;
	}
	/**
	 * The voltage to set if the switch is switched on
	 */
	public set switchVoltage(value: number) {
		this._switchVoltage = this.ValidateVoltage(value);
	}

	private _offVoltage: number;
	/**
	 * The voltage to set if neither switch is on nor presence deteced
	 */
	public get offVoltage(): number {
		return this._offVoltage;
	}
	/**
	 * The voltage to set if neither switch is on nor presence deteced
	 */
	public set offVoltage(value: number) {
		this._offVoltage = this.ValidateVoltage(value);
	}

	private _presenceLastSeen: Date;
	/**
	 * The information when presence was seen last
	 */
	public get presenceLastSeen(): Date {
		return this._presenceLastSeen;
	}

	private _presenceIsDetected: boolean;
	/**
	 * Gets the information if presence ist currently detected
	 */
	public get presenceIsDetected(): boolean {
		return this._presenceIsDetected;
	}

	private _presenceKeepAliveSeconds: number;
	/**
	 * The number of seconds to keep the light switched on after presence was seen last
	 */
	public get presenceKeepAliveSeconds(): number {
		return this._presenceKeepAliveSeconds;
	}
	/**
	 * The number of seconds to keep the light switched on after presence was seen last
	 */
	public set presenceKeepAliveSeconds(value: number) {
		this._presenceKeepAliveSeconds = value;
	}

	private _switchIsOn: boolean;
	/**
	 * If the switch is currently switched on
	 */
	public get switchIsOn(): boolean {
		return this._switchIsOn;
	}

	private _brightnessTreshold: number;
	/**
	 * The voltage from the brightness port under which the light should be switched on
	 */
	public get brightnessTreshold(): number {
		return this._brightnessTreshold;
	}
	/**
	 * The voltage from the brightness port under which the light should be switched on
	 */
	public set brightnessTreshold(value: number) {
		this._brightnessTreshold = this.ValidateVoltage(value);
	}


	private _lightIsOn: boolean;
	/**
	 * If the light is currently switched on
	 */
	public get lightIsOn(): boolean {
		return this._lightIsOn;
	}

	/**
	 * The last checked brightness value
	 */
	private _lastBrightnessMinValue: number;



	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, id: string, name: string) {
		this._megabas = megabas;
		this._id = id;
		this._name = name;
		this._baseObjName = "lightingDevice:" + id;
		this._outputPorts = new Array<PortLink>(0);
		this._presencePorts = new Array<PortLink>(0);
		this._switchPorts = new Array<PortLink>(0);
		this._brightnessPorts = new Array<PortLink>(0);
		this._lastVoltage = -1;

		this._isEnabled = false;
		this._presenceDetectionEnabled = true;
		this._presenceVoltage = 10000;
		this._switchVoltage = 10000;
		this._offVoltage = 0;

		this._presenceLastSeen = new Date(2020, 1, 1);
		this._presenceIsDetected = false;
		this._presenceKeepAliveSeconds = 120;
		this._switchIsOn = false;
		this._brightnessTreshold = 4000;
		this._lightIsOn = false;

		this._lastBrightnessMinValue = 0;
	}

	/**
	 * Initializes the states in the ioBroker object model
	 */
	public async InitializeIoBrokerObjects(): Promise<void> {
		await this._megabas.setObjectNotExistsAsync(this._baseObjName, {
			type: "device",
			common: {
				name: this._name,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".isEnabled", {
			type: "state",
			common: {
				name: "if this lighting device is active",
				type: "boolean",
				role: "switch.enable",
				def: false,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("isEnabled", false);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_voltage", {
			type: "state",
			common: {
				name: "Voltage to set when presence was detected in Millivolt",
				type: "number",
				role: "level",
				min: 0,
				max: 10000,
				def: 10000,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("presence_voltage", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switch_voltage", {
			type: "state",
			common: {
				name: "Voltage to set when the switch is set to ON in Millivolt",
				type: "number",
				role: "level",
				min: 0,
				max: 10000,
				def: 10000,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("switch_voltage", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".off_voltage", {
			type: "state",
			common: {
				name: "Voltage to set when switch and presence are OFF",
				type: "number",
				role: "level",
				min: 0,
				max: 10000,
				def: 0,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("off_voltage", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_lastSeen", {
			type: "state",
			common: {
				name: "Date and time presences was detected last",
				type: "string",
				role: "date",
				read: true,
				write: false,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_keepaliveSeconds", {
			type: "state",
			common: {
				name: "The number of seconds to keep the light switched on when presence was detected",
				type: "number",
				role: "value.interval",
				min: 0,
				def: 120,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("presence_keepaliveSeconds", 0);


		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_detectionEnabled", {
			type: "state",
			common: {
				name: "If the presence detection is enabled (if false: only switch events will be processed)",
				type: "boolean",
				role: "switch.enable",
				def: true,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("presence_detectionEnabled", true);


		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presence_isDetected", {
			type: "state",
			common: {
				name: "If presence was detected within the presence keepalive seconds time ",
				type: "boolean",
				role: "sensor.motion",
				read: true,
				write: false,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switch_isOn", {
			type: "state",
			common: {
				name: "If the switch is switched on",
				type: "boolean",
				role: "switch.light",
				read: true,
				write: false,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".brightness_treshold", {
			type: "state",
			common: {
				name: "Voltage on the brightness signal under that the signal should be switched on",
				type: "number",
				role: "level",
				min: 0,
				max: 10000,
				def: 4000,
				read: true,
				write: true,
			},
			native: {},
		});
		this.SynchronizeState("brightness_treshold", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".outputPorts_count", {
			type: "state",
			common: {
				name: "The number of output ports to connect",
				type: "number",
				role: "state",
				read: true,
				write: true,
				min: 1,
				def: 1,
			},
			native: {},
		});
		this.SynchronizeState("outputPorts_count", 1);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switchPorts_count", {
			type: "state",
			common: {
				name: "The number of input ports for switches to connect",
				type: "number",
				role: "state",
				read: true,
				write: true,
				min: 0,
				def: 1,
			},
			native: {},
		});
		this.SynchronizeState("switchPorts_count", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presencePorts_count", {
			type: "state",
			common: {
				name: "The number of input ports for presence signals to connect",
				type: "number",
				role: "state",
				read: true,
				write: true,
				min: 0,
				def: 1,
			},
			native: {},
		});
		this.SynchronizeState("presencePorts_count", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".brightnessPorts_count", {
			type: "state",
			common: {
				name: "The number of input ports for brightness signals to connect",
				type: "number",
				role: "state",
				read: true,
				write: true,
				min: 0,
				def: 1,
			},
			native: {},
		});
		this.SynchronizeState("brightnessPorts_count", 0);

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".light_isOn", {
			type: "state",
			common: {
				name: "Light is on",
				type: "boolean",
				role: "switch.enable",
				def: true,
				read: true,
				write: false,
			},
			native: {},
		});
		this.SynchronizeState("light_isOn", false);
	}

	/**
	 * Subscribes the relevant properties to changes from ioBroker
	 */
	public SubscribeStates(): void {
		this._megabas.subscribeStates(this._baseObjName + ".isEnabled");
		this._megabas.subscribeStates(this._baseObjName + ".presence_voltage");
		this._megabas.subscribeStates(this._baseObjName + ".switch_voltage");
		this._megabas.subscribeStates(this._baseObjName + ".off_voltage");
		this._megabas.subscribeStates(this._baseObjName + ".presence_detectionEnabled");
		this._megabas.subscribeStates(this._baseObjName + ".presence_keepaliveSeconds");
		this._megabas.subscribeStates(this._baseObjName + ".brightness_treshold");
		this._megabas.subscribeStates(this._baseObjName + ".outputPorts_count");
		this._megabas.subscribeStates(this._baseObjName + ".switchPorts_count");
		this._megabas.subscribeStates(this._baseObjName + ".presencePorts_count");
		this._megabas.subscribeStates(this._baseObjName + ".brightnessPorts_count");
		this._megabas.subscribeStates(this._baseObjName + ".light_isOn");

		this._outputPorts.forEach((port) => { port.SubscribeStates(); });
		this._switchPorts.forEach((port) => { port.SubscribeStates(); });
		this._presencePorts.forEach((port) => { port.SubscribeStates(); });
		this._brightnessPorts.forEach((port) => { port.SubscribeStates(); });
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
				this.SetState(this._baseObjName + "." + stateName, stateName, null, state.val);
			} else {
				this.SetState(this._baseObjName + "." + stateName, stateName, null, defaultValue);
			}
		});
	}

	/**
	 * Validates the given voltage and changes the range if necessary
	 * @param value Voltage to validate
	 */
	private ValidateVoltage(voltage: number): number {
		if (voltage > 10000) {
			if (this._megabas && this._megabas.log) {
				this._megabas.log.warn(`${this._baseObjName}: The voltage value ${voltage} is invalid and will be changed to 10000`);
			}
			return 10000;
		}
		else if (voltage < 0) {
			if (this._megabas && this._megabas.log) {
				this._megabas.log.warn(`${this._baseObjName}: The voltage value ${voltage} is invalid and will be changed to 0`);
			}
			return 0;
		}
		else {
			return voltage;
		}
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
		nextState: string | null,
		val: string | number | boolean | any[] | Record<string, any> | null,
	): void {
		if (state === "isEnabled") {
			if (val) {
				if (typeof val === "boolean") {
					this._isEnabled = val as boolean;
					this._megabas.setStateAsync(fullId, { val: val, ack: true }); // confirm value
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._isEnabled = false;
				this._megabas.setStateAsync(fullId, { val: false, ack: true }); // confirm value
			}
		} else if (state === "presence_detectionEnabled") {
			if (val) {
				if (typeof val === "boolean") {
					this._presenceDetectionEnabled = val as boolean;
					this._megabas.setStateAsync(fullId, { val: val, ack: true }); // confirm value
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._presenceDetectionEnabled = false;
				this._megabas.setStateAsync(fullId, { val: false, ack: true }); // confirm value
			}
		} else if (state === "presence_voltage") {
			this.SetStateNumber(val, 0,
				(value) => {
					this._presenceVoltage = this.ValidateVoltage(value);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				}, () => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				});
		} else if (state === "switch_voltage") {
			this.SetStateNumber(val, 0,
				(value) => {
					this._switchVoltage = this.ValidateVoltage(value);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				}, () => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				});
		} else if (state === "off_voltage") {
			this.SetStateNumber(val, 0,
				(value) => {
					this._offVoltage = this.ValidateVoltage(value);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				}, () => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				});
		} else if (state === "presence_keepaliveSeconds") {
			this.SetStateNumber(val, 0,
				(value) => {
					if (value >= 0) {
						this._presenceKeepAliveSeconds = value;
						this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
					} else {
						this._presenceKeepAliveSeconds = 0;
						this._megabas.setStateAsync(fullId, { val: 0, ack: true }); // confirm value
					}
				}, () => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				});
		} else if (state === "brightness_treshold") {
			this.SetStateNumber(val, 0,
				(value) => {
					this._brightnessTreshold = this.ValidateVoltage(value);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				}, () => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				});
		} else if (state === "outputPorts_count") {
			this.SetStateNumber(val, 0,
				(value) => {
					this.SetStateUpdateArrayCount(value, this._outputPorts, LightingPortTypes.Output);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				},
				() => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			);
		} else if (state === "switchPorts_count") {
			this.SetStateNumber(val, 0,
				(value) => {
					this.SetStateUpdateArrayCount(value, this._switchPorts, LightingPortTypes.Switch);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				},
				() => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			);
		} else if (state === "presencePorts_count") {
			this.SetStateNumber(val, 0,
				(value) => {
					this.SetStateUpdateArrayCount(value, this._presencePorts, LightingPortTypes.Presence);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				},
				() => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			);
		} else if (state === "brightnessPorts_count") {
			this.SetStateNumber(val, 0,
				(value) => {
					this.SetStateUpdateArrayCount(value, this._brightnessPorts, LightingPortTypes.Brightness);
					this._megabas.setStateAsync(fullId, { val: value, ack: true }); // confirm value
				},
				() => {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			);
		} else if (nextState != null && state.indexOf(":") > 0) {
			const splitName = state.split(":", 2);
			const idx = parseInt(splitName[1]);
			if (splitName[0] === "outputPorts") {
				const port = this._outputPorts[idx];
				port.SetState(fullId, nextState, val);
			} else if (splitName[0] === "switchPorts") {
				const port = this._switchPorts[idx];
				port.SetState(fullId, nextState, val);
			} else if (splitName[0] === "presencePorts") {
				const port = this._presencePorts[idx];
				port.SetState(fullId, nextState, val);
			} else if (splitName[0] === "brightnessPorts") {
				const port = this._brightnessPorts[idx];
				port.SetState(fullId, nextState, val);
			}
		} else if (state === "light_isOn") {
			if (val) {
				if (typeof val === "boolean") {
					this._lightIsOn = val as boolean;
					this._megabas.setStateAsync(fullId, { val: val, ack: true }); // confirm value
				} else {
					this._megabas.log.error(`${fullId}: Value ${val} (${typeof val}) is an invalid type`);
				}
			} else {
				this._lightIsOn = false;
				this._megabas.setStateAsync(fullId, { val: false, ack: true }); // confirm value
			}
		} else {
			this._megabas.log.error(`${fullId}: Property ${state} was not found to set value ${val}`);
		}
	}

	/**
	 * Updates the list of available ports to reflect the number of ports
	 * @param count The number of elements to set in the array
	 * @param portArray The array to update
	 * @param portType The type of the ports
	 */
	private SetStateUpdateArrayCount(count: number, portArray: Array<PortLink>, portType: LightingPortTypes) {
		if (count < 0) {
			this._megabas.log.warn(`${this._baseObjName}: The count ${count} is invalid and will be changed to 0`);
			count = 0;
		}

		if (portArray.length < count) {
			// create new output ports
			while (portArray.length < count) {
				this._megabas.log.debug(`${this._baseObjName} creating new ${portType.toString()} port`);
				const port = new PortLink(this._megabas, this, portType, portArray.length.toString());
				port.InitializeIoBrokerObjects();
				portArray.push(port);
				port.SubscribeStates();
			}
		} else if (portArray.length > count) {
			// remove some output ports
			while (portArray.length > count) {
				const port = portArray.pop();
				if (port != null) {
					this._megabas.log.debug(`${this._baseObjName} deleting port ${port.objectName}`);
					port.DeleteIoBrokerObjects();
				}
			}
		}
	}

	/**
	 * Sets the state of a number property
	 * @param val The value to set
	 * @param defaultValue The default value to set if no value is specified
	 * @param successCallback The function that is called if the update is successful
	 * @param errorCallback The function that is called if an error occurs
	 */
	private SetStateNumber(val: string | number | boolean | any[] | Record<string, any> | null,
		defaultValue: number,
		successCallback: NumberCallback, errorCallback: CallableFunction) {
		if (val) {
			if (typeof val === "number") {
				successCallback(val as number);
			} else {
				errorCallback();
			}
		} else {
			successCallback(defaultValue);
		}
	}

	/**
	 * Reads all inputs an checks wether the light has to be switch on or off
	 */
	public UpdateDeviceStatus(): void {
		this._megabas.log.silly(`${this._baseObjName}: Checking status: ${this._isEnabled}`);
		if (!this._isEnabled) {
			return;
		}

		let targetVoltage = this._offVoltage;

		if (this._presenceDetectionEnabled) {
			// Check the presence status
			let presenceDetected = false;
			this._presencePorts.forEach((port) => {
				if (port.IsValidPort()) {
					presenceDetected = presenceDetected || port.GetDryContactClosed();
				} else {
					this._megabas.log.debug(`${this._baseObjName}: Port ${port.objectName} (card: ${port.cardNumber} port: ${port.portNumber}) is not valid`);
				}
			});
			this._megabas.log.silly(`${this._baseObjName}: Presence detected: ${presenceDetected}`);

			if (!this._lightIsOn && this._brightnessPorts.length > 0) {
				// check brightness only if the light is not on currently and there are brightness ports configured 
				let currentBrightness = 0;
				this._brightnessPorts.forEach((port) => {
					if (port.IsValidPort()) {
						if (currentBrightness <= 0) {
							currentBrightness = port.GetVoltageValue();
						} else {
							Math.min(currentBrightness, port.GetVoltageValue());
						}
					} else {
						this._megabas.log.debug(`${this._baseObjName}: Port ${port.objectName} (card: ${port.cardNumber} port: ${port.portNumber}) is not valid`);
					}
				});
				this._lastBrightnessMinValue = currentBrightness;

				this._megabas.log.silly(`${this._baseObjName}: Relevant brightness ${this._lastBrightnessMinValue}`);
			}

			// Update status in ioBroker
			if (presenceDetected != this._presenceIsDetected) {
				this._presenceIsDetected = presenceDetected;
				this._megabas.setStateAsync(this._baseObjName + ".presence_isDetected", presenceDetected, true);
			}
			if (presenceDetected) {
				this._presenceLastSeen = new Date();
				this._megabas.setStateAsync(this._baseObjName + ".presence_lastSeen",
					this._presenceLastSeen.toISOString(), true);
			}

			if (this._brightnessTreshold <= 0 || this._lastBrightnessMinValue <= this._brightnessTreshold) {
				// Either no brightness check was configured or the minimum brightness was too dark
				// Check if the presence was detected within the time with the timeout
				const difference = (Date.now() - this._presenceLastSeen.getTime()) / 1000;
				if (difference <= this._presenceKeepAliveSeconds) {
					targetVoltage = this._presenceVoltage;
				}
			}
		}

		// Check switch status: Switch wins always
		let switchOn = false;
		this._switchPorts.forEach((port) => {
			if (port.IsValidPort()) {
				switchOn = switchOn || port.GetDryContactClosed();
			} else {
				this._megabas.log.debug(`${this._baseObjName}: Port ${port.objectName} (card: ${port.cardNumber} port: ${port.portNumber}) is not valid`);
			}
		});
		if (switchOn != this._switchIsOn) {
			// Switch status changed: Update lighting
			this._switchIsOn = switchOn;
			this._megabas.setStateAsync(this._baseObjName + ".switch_isOn", switchOn, true);
		}
		if (switchOn) {
			targetVoltage = this._switchVoltage;
		}
		this._megabas.log.silly(`${this._baseObjName}: Switch status: ${switchOn}`);

		// Set the voltage in the system
		if (targetVoltage != this._lastVoltage) {
			this._outputPorts.forEach((port) => {
				if (port.IsValidPort()) {
					port.SetVoltageValue(targetVoltage);
				} else {
					this._megabas.log.warn(`${this._baseObjName}: Port ${port.objectName} (card: ${port.cardNumber} port: ${port.portNumber}) is not valid`);
				}
			});
			this._lastVoltage = targetVoltage;
		}

		// Inform ioBroker of the light status changed
		if (this._lightIsOn !== (targetVoltage > this._offVoltage)) {
			this._lightIsOn = (targetVoltage > this._offVoltage);
			this._megabas.setStateAsync(this._baseObjName + ".light_isOn", this._lightIsOn, true);
		}
	}
}

export { LightingDevice };
