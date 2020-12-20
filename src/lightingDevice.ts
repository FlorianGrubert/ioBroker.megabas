import { Megabas } from "./main";
import { PortLink } from "./portLink";

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
				read: true,
				write: true,
			},
			native: {},
		});

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
		// TODO: Go on here
		// Initialize all internal state variables
		// Read value at initialization

	}
}

export { LightingDevice };
