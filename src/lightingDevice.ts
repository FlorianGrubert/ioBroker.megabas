import { Megabas } from "./main";

class LightingDevice {
	// Megabas controller to use
	private _megabas: Megabas;
	// Unique id of the lighting device
	private _id: string;
	// Name of the lighting device
	private _name: string;
	// the base name of the object in ioBroker
	private _baseObjName: string;

	// Returns the name of the device object in ioBroker
	public get objectName(): string {
		return this._baseObjName;
	}

	public constructor(megabas: Megabas, id: string, name: string) {
		this._megabas = megabas;
		this._id = id;
		this._name = name;
		this._baseObjName = "lightingDevice:" + id;
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

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".outputPorts", {
			type: "state",
			common: {
				name: "The output ports to set the mentioned voltages on",
				type: "string",
				role: "state",
				read: true,
				write: true,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".switchPorts", {
			type: "state",
			common: {
				name: "The input ports to read a switch status from",
				type: "string",
				role: "state",
				read: true,
				write: true,
			},
			native: {},
		});

		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".presencePorts", {
			type: "state",
			common: {
				name: "The input ports to read the presence signal  from",
				type: "string",
				role: "state",
				read: true,
				write: true,
			},
			native: {},
		});
		// TODO: Überarbeiten! Die Ports as ordner ausprägen.
		// Eine Eigenschaft mit Anzahl der zu überwachenden Ports
		await this._megabas.setObjectNotExistsAsync(this._baseObjName + ".precensePorts", {
			type: "state",
			common: {
				name: "The input ports to read the presence signal  from",
				type: "string",
				role: "state",
				read: true,
				write: true,
			},
			native: {},
		});
	}
}

export { LightingDevice };
