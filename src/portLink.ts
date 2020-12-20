/**
 * Class that defines the link to a port (input or output)
 */
class PortLink {
	/**
	 * The number of the sackable card the port is attached to [1..8]
	 */
	public card: number;
	/**
	 * The number of the port on the card. [1..4] for output ports or [1..8] for input ports
	 */
	public port: number;

	constructor() {
		this.card = 0;
		this.port = 0;
	}

	/*
	constructor(cardNumber: number, portNumber: number) {
		this._cardNumber = cardNumber;
		this._portNumber = portNumber;
		this._test = "dies ist der Test 2";
    }
    */
}

export { PortLink };
